use crate::models::{auth::AuthUser, entities::ResultRecord};
use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use loco_rs::prelude::*;
use sea_orm::{DatabaseBackend, FromQueryResult, Statement};

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/results")
        .add("", get(list_results))
}

pub async fn list_results(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let student_id = match claims.student_id {
        Some(id) => id,
        None => {
            return Err((
                StatusCode::FORBIDDEN,
                Json(serde_json::json!({ "error": "Only students have individual academic results" })),
            ));
        }
    };

    // Students must only access their own results
    let sql = r#"
        SELECT id, student_id, course_id, subject_name, semester,
               internal_marks::float8, external_marks::float8, total_marks::float8,
               grade, pass_status, sgpa::float8, cgpa::float8
        FROM results
        WHERE student_id = $1
        ORDER BY semester DESC, subject_name ASC;
    "#;

    let results = ResultRecord::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        sql,
        vec![student_id.into()],
    ))
    .all(&ctx.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    Ok(Json(results))
}
