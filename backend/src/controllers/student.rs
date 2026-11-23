use crate::models::{
    auth::{hash_password, verify_password, AuthUser},
    entities::{
        AnnouncementItem, Assignment, ChangePasswordRequest, DashboardStats,
        NotificationItem, StudentProfileView, TimetableSlot, UpdateProfileRequest,
    },
};
use axum::{
    extract::{Json, State},
    http::StatusCode,
    response::IntoResponse,
};
use loco_rs::prelude::*;
use sea_orm::{ConnectionTrait, DatabaseBackend, FromQueryResult, Statement};

pub fn routes() -> Routes {
    Routes::new()
        .add("/api/dashboard", get(get_dashboard))
        .add("/api/profile", get(get_profile))
        .add("/api/profile", put(update_profile))
        .add("/api/students/me", get(get_profile))
        .add("/api/students/me", put(update_profile))
        .add("/api/settings/password", put(change_password))
}

pub async fn get_profile(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let student_id = match claims.student_id {
        Some(id) => id,
        None => {
            return Err((
                StatusCode::FORBIDDEN,
                Json(serde_json::json!({ "error": "User does not have an associated student profile" })),
            ));
        }
    };

    let sql = r#"
        SELECT s.id, s.user_id, u.name, u.email, s.roll_number, s.phone,
               s.department, s.course, s.academic_year, s.semester, s.join_date, s.avatar_url
        FROM students s
        JOIN users u ON u.id = s.user_id
        WHERE s.id = $1;
    "#;
    let student = StudentProfileView::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        sql,
        vec![student_id.into()],
    ))
    .one(&ctx.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
    .ok_or((StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Student profile not found" }))))?;

    Ok(Json(student))
}

pub async fn update_profile(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
    Json(payload): Json<UpdateProfileRequest>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let student_id = match claims.student_id {
        Some(id) => id,
        None => {
            return Err((
                StatusCode::FORBIDDEN,
                Json(serde_json::json!({ "error": "Only students have an editable student profile" })),
            ));
        }
    };

    // Update only permitted personal information (phone and avatar_url)
    // Student ID, Roll Number, and Role are strictly protected from tampering
    let update_sql = r#"
        UPDATE students
        SET phone = COALESCE($1, phone),
            avatar_url = COALESCE($2, avatar_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3;
    "#;
    ctx.db
        .execute_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            update_sql,
            vec![payload.phone.into(), payload.avatar_url.into(), student_id.into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    // Return updated profile
    get_profile(State(ctx), AuthUser(claims)).await
}

pub async fn change_password(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
    Json(payload): Json<ChangePasswordRequest>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    if payload.new_password.len() < 6 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "New password must be at least 6 characters long" })),
        ));
    }

    // 1. Fetch current password hash
    let sql = "SELECT password_hash FROM users WHERE id = $1;";
    let row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            sql,
            vec![claims.sub.into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
        .ok_or((StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "User not found" }))))?;

    let stored_hash: String = row.try_get_by_index(0).unwrap_or_default();

    // 2. Validate current password
    if !verify_password(&payload.current_password, &stored_hash) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Current password provided is incorrect" })),
        ));
    }

    // 3. Hash new password and save
    let new_hash = hash_password(&payload.new_password)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e }))))?;

    let update_sql = "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;";
    ctx.db
        .execute_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            update_sql,
            vec![new_hash.into(), claims.sub.into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    Ok(Json(serde_json::json!({ "message": "Password changed successfully" })))
}

pub async fn get_dashboard(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let student_id = claims.student_id.unwrap_or(1);

    // 1. Student details
    let student_sql = "SELECT roll_number, department, semester FROM students WHERE id = $1;";
    let student_row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            student_sql,
            vec![student_id.into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    let (roll_number, department, semester) = if let Some(r) = student_row {
        (
            r.try_get_by_index::<String>(0).unwrap_or_default(),
            r.try_get_by_index::<String>(1).unwrap_or_default(),
            r.try_get_by_index::<i32>(2).unwrap_or(1),
        )
    } else {
        ("N/A".to_string(), "General".to_string(), 1)
    };

    // 2. Total enrolled courses
    let courses_count_sql = "SELECT COUNT(*) FROM student_courses WHERE student_id = $1;";
    let courses_count_row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            courses_count_sql,
            vec![student_id.into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;
    let total_courses: i64 = courses_count_row.and_then(|r| r.try_get_by_index(0).ok()).unwrap_or(0);

    // 3. Attendance percentage calculated from actual attendance records:
    // Formula: (Classes Attended / Total Classes) * 100
    let attendance_calc_sql = r#"
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'Present' OR status = 'Excused') as attended
        FROM attendance
        WHERE student_id = $1;
    "#;
    let att_row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            attendance_calc_sql,
            vec![student_id.into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    let attendance_percentage = if let Some(r) = att_row {
        let total: i64 = r.try_get_by_index(0).unwrap_or(0);
        let attended: i64 = r.try_get_by_index(1).unwrap_or(0);
        if total > 0 {
            ((attended as f64 / total as f64) * 1000.0).round() / 10.0
        } else {
            100.0
        }
    } else {
        100.0
    };

    // 4. Pending assignments count
    let pending_sql = r#"
        SELECT COUNT(*)
        FROM assignments a
        JOIN student_courses sc ON sc.course_id = a.course_id
        LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = $1
        WHERE sc.student_id = $1 AND (s.id IS NULL OR s.status = 'Pending');
    "#;
    let pending_row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            pending_sql,
            vec![student_id.into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;
    let pending_assignments: i64 = pending_row.and_then(|r| r.try_get_by_index(0).ok()).unwrap_or(0);

    // 5. Upcoming examinations count
    let exams_sql = r#"
        SELECT COUNT(*)
        FROM examinations e
        JOIN student_courses sc ON sc.course_id = e.course_id
        WHERE sc.student_id = $1 AND e.is_completed = false AND e.exam_date >= CURRENT_DATE;
    "#;
    let exams_row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            exams_sql,
            vec![student_id.into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;
    let upcoming_examinations: i64 = exams_row.and_then(|r| r.try_get_by_index(0).ok()).unwrap_or(0);

    // 6. CGPA and SGPA from results
    let cgpa_sql = "SELECT COALESCE(AVG(sgpa), 8.75), COALESCE(MAX(cgpa), 8.75) FROM results WHERE student_id = $1;";
    let cgpa_row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            cgpa_sql,
            vec![student_id.into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    let (sgpa, cgpa) = if let Some(r) = cgpa_row {
        (
            r.try_get_by_index(0).unwrap_or(8.80),
            r.try_get_by_index(1).unwrap_or(8.75),
        )
    } else {
        (8.80, 8.75)
    };

    // 7. Recent announcements
    let recent_announcements = AnnouncementItem::find_by_statement(Statement::from_string(
        DatabaseBackend::Postgres,
        "SELECT id, title, content, target_audience, department, author_name, is_pinned, created_at FROM announcements ORDER BY is_pinned DESC, created_at DESC LIMIT 4;".to_string(),
    ))
    .all(&ctx.db)
    .await
    .unwrap_or_default();

    // 8. Recent notifications
    let notifs_sql = "SELECT id, user_id, title, message, notification_type, link, is_read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5;";
    let recent_notifications = NotificationItem::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        notifs_sql,
        vec![claims.sub.into()],
    ))
    .all(&ctx.db)
    .await
    .unwrap_or_default();

    // 9. Upcoming assignment deadlines
    let deadlines_sql = r#"
        SELECT a.id, a.course_id, a.subject_name, a.title, a.description, a.faculty_name,
               a.assigned_date, a.due_date, a.max_marks, a.created_at
        FROM assignments a
        JOIN student_courses sc ON sc.course_id = a.course_id
        LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = $1
        WHERE sc.student_id = $1 AND (s.id IS NULL OR s.status = 'Pending')
        ORDER BY a.due_date ASC
        LIMIT 4;
    "#;
    let upcoming_deadlines = Assignment::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        deadlines_sql,
        vec![student_id.into()],
    ))
    .all(&ctx.db)
    .await
    .unwrap_or_default();

    // 10. Weekly schedule preview
    let schedule_sql = r#"
        SELECT t.id, t.course_id, t.day_of_week, t.subject_name, t.faculty_name, t.classroom, t.start_time, t.end_time
        FROM timetable t
        JOIN student_courses sc ON sc.course_id = t.course_id
        WHERE sc.student_id = $1
        ORDER BY 
            CASE t.day_of_week
                WHEN 'Monday' THEN 1
                WHEN 'Tuesday' THEN 2
                WHEN 'Wednesday' THEN 3
                WHEN 'Thursday' THEN 4
                WHEN 'Friday' THEN 5
                WHEN 'Saturday' THEN 6
                ELSE 7
            END, t.start_time ASC
        LIMIT 6;
    "#;
    let weekly_schedule = TimetableSlot::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        schedule_sql,
        vec![student_id.into()],
    ))
    .all(&ctx.db)
    .await
    .unwrap_or_default();

    Ok(Json(DashboardStats {
        welcome_name: claims.name,
        student_id: roll_number,
        department,
        semester,
        total_enrolled_courses: total_courses,
        attendance_percentage,
        pending_assignments,
        upcoming_examinations,
        cgpa,
        sgpa,
        recent_announcements,
        recent_notifications,
        upcoming_deadlines,
        weekly_schedule,
    }))
}
