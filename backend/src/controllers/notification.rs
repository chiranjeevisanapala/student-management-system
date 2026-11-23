use crate::models::{auth::AuthUser, entities::NotificationItem};
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
        .prefix("/api/notifications")
        .add("", get(list_notifications))
        .add("/{id}/read", patch(mark_as_read))
        .add("/read-all", patch(mark_all_as_read))
}

pub async fn list_notifications(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let sql = r#"
        SELECT id, user_id, title, message, notification_type, link, is_read, created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC;
    "#;

    let items = NotificationItem::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        sql,
        vec![claims.sub.into()],
    ))
    .all(&ctx.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    Ok(Json(items))
}

pub async fn mark_as_read(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
    Path(id): Path<i32>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let sql = "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2;";
    ctx.db
        .execute_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            sql,
            vec![id.into(), claims.sub.into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    Ok(Json(serde_json::json!({ "message": "Notification marked as read" })))
}

pub async fn mark_all_as_read(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let sql = "UPDATE notifications SET is_read = true WHERE user_id = $1;";
    ctx.db
        .execute_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            sql,
            vec![claims.sub.into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    Ok(Json(serde_json::json!({ "message": "All notifications marked as read" })))
}
