use crate::models::{
    auth::AuthUser,
    entities::{AssignmentWithSubmissionView, SubmitAssignmentRequest},
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::{NaiveDate, Utc};
use loco_rs::prelude::*;
use sea_orm::{ConnectionTrait, DatabaseBackend, FromQueryResult, Statement};
use std::fs;

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/assignments")
        .add("", get(list_assignments))
        .add("/{id}", get(get_assignment))
        .add("/{id}/submit", post(submit_assignment))
}

pub async fn list_assignments(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let student_id = claims.student_id.unwrap_or(1);

    let sql = r#"
        SELECT a.id, a.course_id, a.subject_name, a.title, a.description, a.faculty_name,
               a.assigned_date, a.due_date, a.max_marks,
               s.id as submission_id, s.submission_text, s.file_url, s.file_name,
               s.submitted_at, s.marks, s.feedback,
               COALESCE(s.status, 'Pending') as status
        FROM assignments a
        JOIN student_courses sc ON sc.course_id = a.course_id
        LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = $1
        WHERE sc.student_id = $1
        ORDER BY a.due_date ASC;
    "#;

    let assignments = AssignmentWithSubmissionView::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        sql,
        vec![student_id.into()],
    ))
    .all(&ctx.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    Ok(Json(assignments))
}

pub async fn get_assignment(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
    Path(id): Path<i32>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let student_id = claims.student_id.unwrap_or(1);

    let sql = r#"
        SELECT a.id, a.course_id, a.subject_name, a.title, a.description, a.faculty_name,
               a.assigned_date, a.due_date, a.max_marks,
               s.id as submission_id, s.submission_text, s.file_url, s.file_name,
               s.submitted_at, s.marks, s.feedback,
               COALESCE(s.status, 'Pending') as status
        FROM assignments a
        JOIN student_courses sc ON sc.course_id = a.course_id
        LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = $1
        WHERE a.id = $2 AND sc.student_id = $1;
    "#;

    let assignment = AssignmentWithSubmissionView::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        sql,
        vec![student_id.into(), id.into()],
    ))
    .one(&ctx.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
    .ok_or((StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Assignment not found or you are not enrolled in this course" }))))?;

    Ok(Json(assignment))
}

pub async fn submit_assignment(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
    Path(id): Path<i32>,
    Json(payload): Json<SubmitAssignmentRequest>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let student_id = match claims.student_id {
        Some(s) => s,
        None => {
            return Err((
                StatusCode::FORBIDDEN,
                Json(serde_json::json!({ "error": "Only students can submit assignments" })),
            ));
        }
    };

    // 1. Fetch assignment due date
    let assign_sql = "SELECT due_date FROM assignments WHERE id = $1;";
    let row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            assign_sql,
            vec![id.into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
        .ok_or((StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Assignment not found" }))))?;

    let due_date: NaiveDate = row.try_get_by_index(0).unwrap_or_else(|_| Utc::now().date_naive());
    let current_date = Utc::now().date_naive();
    let status = if current_date > due_date { "Late" } else { "Submitted" };

    // 2. Handle file storage if provided
    let mut file_url = None;
    let mut file_name = None;

    if let (Some(name), Some(b64)) = (payload.file_name, payload.file_data_base64) {
        let upload_dir = std::env::var("UPLOAD_DIR").unwrap_or_else(|_| "uploads".to_string());
        let _ = fs::create_dir_all(&upload_dir);

        let sanitized_name = name.replace(|c: char| !c.is_alphanumeric() && c != '.' && c != '-' && c != '_', "_");
        let unique_name = format!("{}_{}_{}", student_id, id, sanitized_name);
        let file_path = format!("{}/{}", upload_dir, unique_name);

        use base64::Engine;
        if let Ok(bytes) = base64::engine::general_purpose::STANDARD.decode(b64.as_bytes()) {
            if fs::write(&file_path, bytes).is_ok() {
                file_url = Some(format!("/uploads/{}", unique_name));
                file_name = Some(sanitized_name);
            }
        }
    }

    // 3. Upsert submission
    let upsert_sql = r#"
        INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, file_url, file_name, status, submitted_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        ON CONFLICT (assignment_id, student_id)
        DO UPDATE SET
            submission_text = EXCLUDED.submission_text,
            file_url = COALESCE(EXCLUDED.file_url, assignment_submissions.file_url),
            file_name = COALESCE(EXCLUDED.file_name, assignment_submissions.file_name),
            status = EXCLUDED.status,
            submitted_at = CURRENT_TIMESTAMP
        RETURNING id;
    "#;

    let sub_row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            upsert_sql,
            vec![
                id.into(),
                student_id.into(),
                payload.submission_text.into(),
                file_url.into(),
                file_name.into(),
                status.into(),
            ],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
        .ok_or((StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "Failed to save submission" }))))?;

    let sub_id: i32 = sub_row.try_get_by_index(0).unwrap_or(0);

    // Create notification
    let notif_sql = r#"
        INSERT INTO notifications (user_id, title, message, notification_type, link)
        VALUES ($1, 'Assignment Submitted', 'Your assignment has been submitted successfully and queued for grading.', 'assignment', '/assignments');
    "#;
    let _ = ctx
        .db
        .execute_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            notif_sql,
            vec![claims.sub.into()],
        ))
        .await;

    Ok(Json(serde_json::json!({
        "message": "Assignment submitted successfully",
        "submission_id": sub_id,
        "status": status
    })))
}
