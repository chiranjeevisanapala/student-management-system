use crate::models::{auth::AuthUser, entities::TimetableSlot};
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
        .prefix("/api/timetable")
        .add("", get(get_timetable))
}

pub async fn get_timetable(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let student_id = claims.student_id.unwrap_or(1);

    let sql = r#"
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
            END, t.start_time ASC;
    "#;

    let slots = TimetableSlot::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        sql,
        vec![student_id.into()],
    ))
    .all(&ctx.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    Ok(Json(slots))
}
