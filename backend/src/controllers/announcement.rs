use crate::models::{auth::AuthUser, entities::AnnouncementItem};
use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use loco_rs::prelude::*;
use sea_orm::{DatabaseBackend, FromQueryResult, Statement};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct AnnouncementQuery {
    pub search: Option<String>,
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/announcements")
        .add("", get(list_announcements))
}

pub async fn list_announcements(
    State(ctx): State<AppContext>,
    AuthUser(_claims): AuthUser,
    Query(params): Query<AnnouncementQuery>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let mut sql = r#"
        SELECT id, title, content, target_audience, department, author_name, is_pinned, created_at
        FROM announcements
        WHERE 1=1
    "#.to_string();

    let mut values = vec![];

    if let Some(ref search) = params.search {
        if !search.trim().is_empty() {
            values.push(format!("%{}%", search.trim()).into());
            sql.push_str(&format!(" AND (title ILIKE ${0} OR content ILIKE ${0})", values.len()));
        }
    }

    sql.push_str(" ORDER BY is_pinned DESC, created_at DESC;");

    let announcements = AnnouncementItem::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        &sql,
        values,
    ))
    .all(&ctx.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    Ok(Json(announcements))
}
