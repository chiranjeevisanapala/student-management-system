use crate::models::auth::FacultyUser;
use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::NaiveDate;
use loco_rs::prelude::*;
use sea_orm::{ConnectionTrait, DatabaseBackend, Statement};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct RecordAttendanceRequest {
    pub student_id: i32,
    pub course_id: i32,
    pub subject_name: String,
    pub date: NaiveDate,
    pub status: String,
    pub remarks: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAssignmentRequest {
    pub course_id: i32,
    pub subject_name: String,
    pub title: String,
    pub description: Option<String>,
    pub due_date: NaiveDate,
    pub max_marks: i32,
}

#[derive(Debug, Deserialize)]
pub struct GradeSubmissionRequest {
    pub submission_id: i32,
    pub marks: i32,
    pub feedback: Option<String>,
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/faculty")
        .add("/courses", get(list_faculty_courses))
        .add("/students", get(list_assigned_students))
        .add("/attendance", post(record_attendance))
        .add("/assignments", post(create_assignment))
        .add("/submissions", get(list_submissions))
        .add("/grade", post(grade_submission))
}

pub async fn list_faculty_courses(
    State(ctx): State<AppContext>,
    FacultyUser(_fac): FacultyUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let sql = r#"
        SELECT c.id, c.code, c.name, c.department, c.credits, c.semester, c.faculty_name,
               COUNT(sc.student_id) as enrolled_students
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
            "enrolled_students": r.try_get_by_index::<i64>(7).unwrap_or(0),
        }));
    }

    Ok(Json(courses))
}

pub async fn list_assigned_students(
    State(ctx): State<AppContext>,
    FacultyUser(_fac): FacultyUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let sql = r#"
        SELECT DISTINCT s.id, s.roll_number, u.name, u.email, s.department, s.course, s.semester
        FROM students s
        JOIN users u ON u.id = s.user_id
        JOIN student_courses sc ON sc.student_id = s.id
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
            "roll_number": r.try_get_by_index::<String>(1).unwrap_or_default(),
            "name": r.try_get_by_index::<String>(2).unwrap_or_default(),
            "email": r.try_get_by_index::<String>(3).unwrap_or_default(),
            "department": r.try_get_by_index::<String>(4).unwrap_or_default(),
            "course": r.try_get_by_index::<String>(5).unwrap_or_default(),
            "semester": r.try_get_by_index::<i32>(6).unwrap_or(1),
        }));
    }

    Ok(Json(students))
}

pub async fn record_attendance(
    State(ctx): State<AppContext>,
    FacultyUser(_fac): FacultyUser,
    Json(payload): Json<RecordAttendanceRequest>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let sql = r#"
        INSERT INTO attendance (student_id, course_id, subject_name, date, status, remarks)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id;
    "#;
    let row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            sql,
            vec![
                payload.student_id.into(),
                payload.course_id.into(),
                payload.subject_name.trim().into(),
                payload.date.into(),
                payload.status.trim().into(),
                payload.remarks.into(),
            ],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
        .ok_or((StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "Failed to record attendance" }))))?;

    let id: i32 = row.try_get_by_index(0).unwrap_or(0);
    Ok((StatusCode::CREATED, Json(serde_json::json!({ "message": "Attendance recorded", "attendance_id": id }))))
}

pub async fn create_assignment(
    State(ctx): State<AppContext>,
    FacultyUser(fac): FacultyUser,
    Json(payload): Json<CreateAssignmentRequest>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let sql = r#"
        INSERT INTO assignments (course_id, subject_name, title, description, faculty_name, assigned_date, due_date, max_marks)
        VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7)
        RETURNING id;
    "#;
    let row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            sql,
            vec![
                payload.course_id.into(),
                payload.subject_name.trim().into(),
                payload.title.trim().into(),
                payload.description.into(),
                fac.name.into(),
                payload.due_date.into(),
                payload.max_marks.into(),
            ],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
        .ok_or((StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "Failed to create assignment" }))))?;

    let id: i32 = row.try_get_by_index(0).unwrap_or(0);
    Ok((StatusCode::CREATED, Json(serde_json::json!({ "message": "Assignment created", "assignment_id": id }))))
}

pub async fn list_submissions(
    State(ctx): State<AppContext>,
    FacultyUser(_fac): FacultyUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let sql = r#"
        SELECT s.id, s.assignment_id, a.title as assignment_title, a.subject_name,
               st.roll_number, u.name as student_name,
               s.submission_text, s.file_url, s.file_name, s.submitted_at, s.marks, s.feedback, s.status
        FROM assignment_submissions s
        JOIN assignments a ON a.id = s.assignment_id
        JOIN students st ON st.id = s.student_id
        JOIN users u ON u.id = st.user_id
        ORDER BY s.submitted_at DESC;
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
            "assignment_id": r.try_get_by_index::<i32>(1).unwrap_or(0),
            "assignment_title": r.try_get_by_index::<String>(2).unwrap_or_default(),
            "subject_name": r.try_get_by_index::<String>(3).unwrap_or_default(),
            "student_roll": r.try_get_by_index::<String>(4).unwrap_or_default(),
            "student_name": r.try_get_by_index::<String>(5).unwrap_or_default(),
            "submission_text": r.try_get_by_index::<Option<String>>(6).ok().flatten(),
            "file_url": r.try_get_by_index::<Option<String>>(7).ok().flatten(),
            "file_name": r.try_get_by_index::<Option<String>>(8).ok().flatten(),
            "submitted_at": r.try_get_by_index::<chrono::DateTime<chrono::Utc>>(9).ok(),
            "marks": r.try_get_by_index::<Option<i32>>(10).ok().flatten(),
            "feedback": r.try_get_by_index::<Option<String>>(11).ok().flatten(),
            "status": r.try_get_by_index::<String>(12).unwrap_or_default(),
        }));
    }

    Ok(Json(list))
}

pub async fn grade_submission(
    State(ctx): State<AppContext>,
    FacultyUser(_fac): FacultyUser,
    Json(payload): Json<GradeSubmissionRequest>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let sql = r#"
        UPDATE assignment_submissions
        SET marks = $1, feedback = $2, status = 'Graded', updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING student_id, assignment_id;
    "#;
    let row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            sql,
            vec![payload.marks.into(), payload.feedback.into(), payload.submission_id.into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
        .ok_or((StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Submission not found" }))))?;

    let student_id: i32 = row.try_get_by_index(0).unwrap_or(0);
    let assign_id: i32 = row.try_get_by_index(1).unwrap_or(0);

    // Notify student of graded assignment
    let notif_sql = r#"
        INSERT INTO notifications (user_id, title, message, notification_type, link)
        SELECT s.user_id, 'Assignment Graded', 'Your submission for assignment #' || $2 || ' has been graded: ' || $3 || ' marks.', 'assignment', '/assignments'
        FROM students s WHERE s.id = $1;
    "#;
    let _ = ctx
        .db
        .execute_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            notif_sql,
            vec![student_id.into(), assign_id.into(), payload.marks.into()],
        ))
        .await;

    Ok(Json(serde_json::json!({ "message": "Submission graded successfully" })))
}
