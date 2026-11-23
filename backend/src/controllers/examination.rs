use crate::models::{auth::AuthUser, entities::ExaminationItem};
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
        .prefix("/api/examinations")
        .add("", get(list_examinations))
}

pub async fn list_examinations(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let student_id = claims.student_id.unwrap_or(1);

    let sql = r#"
        SELECT e.id, e.course_id, e.subject_name, e.exam_name, e.exam_type, e.exam_date,
               e.start_time, e.end_time, e.exam_hall, e.instructions, e.is_completed
        FROM examinations e
        JOIN student_courses sc ON sc.course_id = e.course_id
        WHERE sc.student_id = $1
        ORDER BY e.exam_date ASC;
    "#;

    let exams = ExaminationItem::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        sql,
        vec![student_id.into()],
    ))
    .all(&ctx.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    Ok(Json(exams))
}
