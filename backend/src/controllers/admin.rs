use crate::models::auth::{hash_password, AdminUser};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use loco_rs::prelude::*;
use sea_orm::{ConnectionTrait, DatabaseBackend, Statement};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct CreateCourseRequest {
    pub code: String,
    pub name: String,
    pub department: String,
    pub credits: i32,
    pub semester: i32,
    pub description: Option<String>,
    pub faculty_name: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateFacultyRequest {
    pub email: String,
    pub name: String,
    pub password: String,
    pub employee_id: String,
    pub department: String,
    pub designation: String,
    pub qualification: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateRequestStatus {
    pub status: String,
    pub remarks: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAnnouncementRequest {
    pub title: String,
    pub content: String,
    pub target_audience: String,
    pub department: Option<String>,
    pub is_pinned: Option<bool>,
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/admin")
        .add("/stats", get(get_stats))
        .add("/students", get(list_students))
        .add("/courses", get(list_courses))
        .add("/courses", post(create_course))
        .add("/faculty", get(list_faculty))
        .add("/faculty", post(create_faculty))
        .add("/requests", get(list_all_requests))
        .add("/requests/{id}", patch(update_request_status))
        .add("/announcements", post(create_announcement))
}

pub async fn get_stats(
    State(ctx): State<AppContext>,
    AdminUser(_admin): AdminUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let sql = r#"
        SELECT 
            (SELECT COUNT(*) FROM students) as total_students,
            (SELECT COUNT(*) FROM faculty) as total_faculty,
            (SELECT COUNT(*) FROM courses) as total_courses,
            (SELECT COUNT(*) FROM student_requests WHERE status = 'Pending') as pending_requests;
    "#;
    let row = ctx
        .db
        .query_one_raw(Statement::from_string(DatabaseBackend::Postgres, sql.to_string()))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    let stats = if let Some(r) = row {
        serde_json::json!({
            "total_students": r.try_get_by_index::<i64>(0).unwrap_or(0),
            "total_faculty": r.try_get_by_index::<i64>(1).unwrap_or(0),
            "total_courses": r.try_get_by_index::<i64>(2).unwrap_or(0),
            "pending_requests": r.try_get_by_index::<i64>(3).unwrap_or(0),
        })
    } else {
        serde_json::json!({
            "total_students": 0,
            "total_faculty": 0,
            "total_courses": 0,
            "pending_requests": 0,
        })
    };

    Ok(Json(stats))
}

pub async fn list_students(
    State(ctx): State<AppContext>,
    AdminUser(_admin): AdminUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let sql = r#"
        SELECT s.id, s.user_id, u.name, u.email, s.roll_number, s.phone,
               s.department, s.course, s.academic_year, s.semester, s.join_date, u.is_active
        FROM students s
        JOIN users u ON u.id = s.user_id
        ORDER BY s.roll_number ASC;
    "#;
    let rows = ctx
        .db
        .query_all_raw(Statement::from_string(DatabaseBackend::Postgres, sql.to_string()))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    let mut students = Vec::new();
    for r in rows {
        students.push(serde_json::json!({
            "id": r.try_get_by_index::<i32>(0).unwrap_or(0),
            "user_id": r.try_get_by_index::<i32>(1).unwrap_or(0),
            "name": r.try_get_by_index::<String>(2).unwrap_or_default(),
            "email": r.try_get_by_index::<String>(3).unwrap_or_default(),
            "roll_number": r.try_get_by_index::<String>(4).unwrap_or_default(),
            "phone": r.try_get_by_index::<Option<String>>(5).ok().flatten(),
            "department": r.try_get_by_index::<String>(6).unwrap_or_default(),
            "course": r.try_get_by_index::<String>(7).unwrap_or_default(),
            "academic_year": r.try_get_by_index::<String>(8).unwrap_or_default(),
            "semester": r.try_get_by_index::<i32>(9).unwrap_or(1),
            "is_active": r.try_get_by_index::<bool>(11).unwrap_or(true),
        }));
    }

    Ok(Json(students))
}

pub async fn list_courses(
    State(ctx): State<AppContext>,
    AdminUser(_admin): AdminUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let sql = r#"
        SELECT c.id, c.code, c.name, c.department, c.credits, c.semester, c.faculty_name,
               COUNT(sc.student_id) as enrolled_count
        FROM courses c
        LEFT JOIN student_courses sc ON sc.course_id = c.id
        GROUP BY c.id, c.code, c.name, c.department, c.credits, c.semester, c.faculty_name
        ORDER BY c.code ASC;
    "#;
    let rows = ctx
        .db
        .query_all_raw(Statement::from_string(DatabaseBackend::Postgres, sql.to_string()))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    let mut courses = Vec::new();
    for r in rows {
        courses.push(serde_json::json!({
            "id": r.try_get_by_index::<i32>(0).unwrap_or(0),
            "code": r.try_get_by_index::<String>(1).unwrap_or_default(),
            "name": r.try_get_by_index::<String>(2).unwrap_or_default(),
            "department": r.try_get_by_index::<String>(3).unwrap_or_default(),
            "credits": r.try_get_by_index::<i32>(4).unwrap_or(4),
            "semester": r.try_get_by_index::<i32>(5).unwrap_or(1),
            "faculty_name": r.try_get_by_index::<String>(6).unwrap_or_default(),
            "enrolled_count": r.try_get_by_index::<i64>(7).unwrap_or(0),
        }));
    }

    Ok(Json(courses))
}

pub async fn create_course(
    State(ctx): State<AppContext>,
    AdminUser(_admin): AdminUser,
    Json(payload): Json<CreateCourseRequest>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let sql = r#"
        INSERT INTO courses (code, name, department, credits, semester, description, faculty_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
    "#;
    let row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            sql,
            vec![
                payload.code.trim().into(),
                payload.name.trim().into(),
                payload.department.trim().into(),
                payload.credits.into(),
                payload.semester.into(),
                payload.description.into(),
                payload.faculty_name.trim().into(),
            ],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
        .ok_or((StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "Failed to create course" }))))?;

    let id: i32 = row.try_get_by_index(0).unwrap_or(0);
    Ok((StatusCode::CREATED, Json(serde_json::json!({ "message": "Course created successfully", "course_id": id }))))
}

pub async fn list_faculty(
    State(ctx): State<AppContext>,
    AdminUser(_admin): AdminUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let sql = r#"
        SELECT f.id, f.user_id, u.name, u.email, f.employee_id, f.phone,
               f.department, f.designation, f.qualification
        FROM faculty f
        JOIN users u ON u.id = f.user_id
        ORDER BY f.employee_id ASC;
    "#;
    let rows = ctx
        .db
        .query_all_raw(Statement::from_string(DatabaseBackend::Postgres, sql.to_string()))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    let mut list = Vec::new();
    for r in rows {
        list.push(serde_json::json!({
            "id": r.try_get_by_index::<i32>(0).unwrap_or(0),
            "user_id": r.try_get_by_index::<i32>(1).unwrap_or(0),
            "name": r.try_get_by_index::<String>(2).unwrap_or_default(),
            "email": r.try_get_by_index::<String>(3).unwrap_or_default(),
            "employee_id": r.try_get_by_index::<String>(4).unwrap_or_default(),
            "phone": r.try_get_by_index::<Option<String>>(5).ok().flatten(),
            "department": r.try_get_by_index::<String>(6).unwrap_or_default(),
            "designation": r.try_get_by_index::<String>(7).unwrap_or_default(),
            "qualification": r.try_get_by_index::<String>(8).unwrap_or_default(),
        }));
    }

    Ok(Json(list))
}

pub async fn create_faculty(
    State(ctx): State<AppContext>,
    AdminUser(_admin): AdminUser,
    Json(payload): Json<CreateFacultyRequest>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let pwd_hash = hash_password(&payload.password)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e }))))?;

    let user_sql = r#"
        INSERT INTO users (email, password_hash, role, name, is_active)
        VALUES ($1, $2, 'faculty', $3, true)
        RETURNING id;
    "#;
    let user_row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            user_sql,
            vec![
                payload.email.trim().to_lowercase().into(),
                pwd_hash.into(),
                payload.name.trim().into(),
            ],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
        .ok_or((StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "Failed to create user" }))))?;

    let user_id: i32 = user_row.try_get_by_index(0).unwrap_or(0);

    let fac_sql = r#"
        INSERT INTO faculty (user_id, employee_id, phone, department, designation, qualification)
        VALUES ($1, $2, NULL, $3, $4, $5)
        RETURNING id;
    "#;
    let fac_row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            fac_sql,
            vec![
                user_id.into(),
                payload.employee_id.trim().into(),
                payload.department.trim().into(),
                payload.designation.trim().into(),
                payload.qualification.trim().into(),
            ],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
        .ok_or((StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "Failed to create faculty record" }))))?;

    let fac_id: i32 = fac_row.try_get_by_index(0).unwrap_or(0);
    Ok((StatusCode::CREATED, Json(serde_json::json!({ "message": "Faculty member created", "faculty_id": fac_id }))))
}

pub async fn list_all_requests(
    State(ctx): State<AppContext>,
    AdminUser(_admin): AdminUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let sql = r#"
        SELECT r.id, r.student_id, s.roll_number, u.name as student_name,
               r.request_type, r.description, r.status, r.remarks, r.created_at
        FROM student_requests r
        JOIN students s ON s.id = r.student_id
        JOIN users u ON u.id = s.user_id
        ORDER BY r.created_at DESC;
    "#;
    let rows = ctx
        .db
        .query_all_raw(Statement::from_string(DatabaseBackend::Postgres, sql.to_string()))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    let mut list = Vec::new();
    for r in rows {
        list.push(serde_json::json!({
            "id": r.try_get_by_index::<i32>(0).unwrap_or(0),
            "student_id": r.try_get_by_index::<i32>(1).unwrap_or(0),
            "roll_number": r.try_get_by_index::<String>(2).unwrap_or_default(),
            "student_name": r.try_get_by_index::<String>(3).unwrap_or_default(),
            "request_type": r.try_get_by_index::<String>(4).unwrap_or_default(),
            "description": r.try_get_by_index::<String>(5).unwrap_or_default(),
            "status": r.try_get_by_index::<String>(6).unwrap_or_default(),
            "remarks": r.try_get_by_index::<Option<String>>(7).ok().flatten(),
            "created_at": r.try_get_by_index::<chrono::DateTime<chrono::Utc>>(8).ok(),
        }));
    }

    Ok(Json(list))
}

pub async fn update_request_status(
    State(ctx): State<AppContext>,
    AdminUser(admin): AdminUser,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateRequestStatus>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let update_sql = r#"
        UPDATE student_requests
        SET status = $1, remarks = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING student_id, request_type;
    "#;
    let row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            update_sql,
            vec![payload.status.trim().into(), payload.remarks.clone().into(), id.into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
        .ok_or((StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Request not found" }))))?;

    let student_id: i32 = row.try_get_by_index(0).unwrap_or(0);
    let req_type: String = row.try_get_by_index(1).unwrap_or_default();

    // Log in request history
    let history_sql = r#"
        INSERT INTO request_history (request_id, action, changed_by, notes)
        VALUES ($1, $2, $3, $4);
    "#;
    let _ = ctx
        .db
        .execute_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            history_sql,
            vec![
                id.into(),
                payload.status.trim().into(),
                admin.name.into(),
                payload.remarks.unwrap_or_else(|| "Status updated by Administrator".to_string()).into(),
            ],
        ))
        .await;

    // Notify student
    let notif_sql = r#"
        INSERT INTO notifications (user_id, title, message, notification_type, link)
        SELECT s.user_id, 'Request ' || $2, 'Your ' || $3 || ' request has been updated to: ' || $2, 'request', '/requests'
        FROM students s WHERE s.id = $1;
    "#;
    let _ = ctx
        .db
        .execute_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            notif_sql,
            vec![student_id.into(), payload.status.trim().into(), req_type.into()],
        ))
        .await;

    Ok(Json(serde_json::json!({ "message": "Request status updated successfully" })))
}

pub async fn create_announcement(
    State(ctx): State<AppContext>,
    AdminUser(admin): AdminUser,
    Json(payload): Json<CreateAnnouncementRequest>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let sql = r#"
        INSERT INTO announcements (title, content, target_audience, department, author_name, is_pinned)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id;
    "#;
    let row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            sql,
            vec![
                payload.title.trim().into(),
                payload.content.trim().into(),
                payload.target_audience.trim().into(),
                payload.department.into(),
                admin.name.into(),
                payload.is_pinned.unwrap_or(false).into(),
            ],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
        .ok_or((StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "Failed to create announcement" }))))?;

    let id: i32 = row.try_get_by_index(0).unwrap_or(0);
    Ok((StatusCode::CREATED, Json(serde_json::json!({ "message": "Announcement published", "announcement_id": id }))))
}
