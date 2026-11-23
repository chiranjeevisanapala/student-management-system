use crate::models::{
    auth::AuthUser,
    entities::{CreateStudentRequest, StudentRequestItem},
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use loco_rs::prelude::*;
use sea_orm::{ConnectionTrait, DatabaseBackend, FromQueryResult, Statement};

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/requests")
        .add("", get(list_requests))
        .add("", post(create_request))
        .add("/{id}", get(get_request))
}

pub async fn list_requests(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let student_id = match claims.student_id {
        Some(id) => id,
        None => {
            return Err((
                StatusCode::FORBIDDEN,
                Json(serde_json::json!({ "error": "Only students have personal academic requests" })),
            ));
        }
    };

    let sql = r#"
        SELECT id, student_id, request_type, description, status, remarks, created_at, updated_at
        FROM student_requests
        WHERE student_id = $1
        ORDER BY created_at DESC;
    "#;

    let requests = StudentRequestItem::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        sql,
        vec![student_id.into()],
    ))
    .all(&ctx.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    Ok(Json(requests))
}

pub async fn create_request(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
    Json(payload): Json<CreateStudentRequest>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let student_id = match claims.student_id {
        Some(id) => id,
        None => {
            return Err((
                StatusCode::FORBIDDEN,
                Json(serde_json::json!({ "error": "Only registered students can submit formal academic requests" })),
            ));
        }
    };

    if payload.request_type.trim().is_empty() || payload.description.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Request type and description are required" })),
        ));
    }

    let insert_sql = r#"
        INSERT INTO student_requests (student_id, request_type, description, status)
        VALUES ($1, $2, $3, 'Pending')
        RETURNING id, student_id, request_type, description, status, remarks, created_at, updated_at;
    "#;

    let item = StudentRequestItem::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        insert_sql,
        vec![
            student_id.into(),
            payload.request_type.trim().into(),
            payload.description.trim().into(),
        ],
    ))
    .one(&ctx.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
    .ok_or((StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "Failed to create request" }))))?;

    // Record request history
    let history_sql = r#"
        INSERT INTO request_history (request_id, action, changed_by, notes)
        VALUES ($1, 'Submitted', $2, 'Request initially submitted by student');
    "#;
    let _ = ctx
        .db
        .execute_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            history_sql,
            vec![item.id.into(), claims.name.into()],
        ))
        .await;

    // Send notification
    let notif_sql = r#"
        INSERT INTO notifications (user_id, title, message, notification_type, link)
        VALUES ($1, 'Request Submitted Successfully', 'Your ' || $2 || ' has been received and queued for review.', 'request', '/requests');
    "#;
    let _ = ctx
        .db
        .execute_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            notif_sql,
            vec![claims.sub.into(), payload.request_type.trim().into()],
        ))
        .await;

    Ok((StatusCode::CREATED, Json(item)))
}

pub async fn get_request(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
    Path(id): Path<i32>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let student_id = claims.student_id.unwrap_or(1);

    let sql = r#"
        SELECT id, student_id, request_type, description, status, remarks, created_at, updated_at
        FROM student_requests
        WHERE id = $1 AND (student_id = $2 OR $3 = 'admin' OR $3 = 'faculty');
    "#;

    let item = StudentRequestItem::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        sql,
        vec![id.into(), student_id.into(), claims.role.into()],
    ))
    .one(&ctx.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
    .ok_or((StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Request not found" }))))?;

    // Fetch history
    let history_sql = r#"
        SELECT action, changed_by, notes, created_at
        FROM request_history
        WHERE request_id = $1
        ORDER BY created_at ASC;
    "#;
    let history_rows = ctx
        .db
        .query_all_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            history_sql,
            vec![id.into()],
        ))
        .await
        .unwrap_or_default();

    let mut history = Vec::new();
    for r in history_rows {
        history.push(serde_json::json!({
            "action": r.try_get_by_index::<String>(0).unwrap_or_default(),
            "changed_by": r.try_get_by_index::<String>(1).unwrap_or_default(),
            "notes": r.try_get_by_index::<Option<String>>(2).ok().flatten(),
            "created_at": r.try_get_by_index::<chrono::DateTime<chrono::Utc>>(3).ok(),
        }));
    }

    Ok(Json(serde_json::json!({
        "request": item,
        "history": history
    })))
}
