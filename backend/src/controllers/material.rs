use crate::models::{auth::AuthUser, entities::StudyMaterialItem};
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
pub struct MaterialQuery {
    pub search: Option<String>,
    pub material_type: Option<String>,
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/materials")
        .add("", get(list_materials))
}

pub async fn list_materials(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
    Query(params): Query<MaterialQuery>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let student_id = claims.student_id.unwrap_or(1);

    let mut sql = r#"
        SELECT m.id, m.course_id, m.subject_name, m.title, m.material_type,
               m.file_url, m.file_name, m.file_size, m.uploaded_by, m.created_at
        FROM study_materials m
        JOIN student_courses sc ON sc.course_id = m.course_id
        WHERE sc.student_id = $1
    "#.to_string();

    let mut values = vec![student_id.into()];

    if let Some(ref search) = params.search {
        if !search.trim().is_empty() {
            values.push(format!("%{}%", search.trim()).into());
            sql.push_str(&format!(" AND (m.title ILIKE ${0} OR m.subject_name ILIKE ${0})", values.len()));
        }
    }

    if let Some(ref mtype) = params.material_type {
        if !mtype.trim().is_empty() && mtype != "all" {
            values.push(mtype.trim().into());
            sql.push_str(&format!(" AND m.material_type = ${}", values.len()));
        }
    }

    sql.push_str(" ORDER BY m.created_at DESC;");

    let materials = StudyMaterialItem::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        &sql,
        values,
    ))
    .all(&ctx.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    Ok(Json(materials))
}
