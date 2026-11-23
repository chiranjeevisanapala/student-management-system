use crate::models::{
    auth::AuthUser,
    entities::{Course, EnrolledCourseView},
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use loco_rs::prelude::*;
use sea_orm::{DatabaseBackend, FromQueryResult, Statement};

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/courses")
        .add("", get(list_courses))
        .add("/{id}", get(get_course))
}

pub async fn list_courses(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let student_id = claims.student_id.unwrap_or(1);

    // Only display courses assigned/enrolled for that student
    let sql = r#"
        SELECT c.id, c.code, c.name, c.department, c.credits, c.semester, c.description, c.faculty_name,
               sc.progress, sc.status,
               COUNT(a.id) FILTER (WHERE a.status = 'Present' OR a.status = 'Excused') as attended_classes,
               COUNT(a.id) as total_classes,
               CASE 
                   WHEN COUNT(a.id) > 0 THEN 
                       ROUND((COUNT(a.id) FILTER (WHERE a.status = 'Present' OR a.status = 'Excused')::numeric / COUNT(a.id)::numeric) * 100, 1)::float8
                   ELSE 100.0
               END as attendance_percentage
        FROM courses c
        JOIN student_courses sc ON sc.course_id = c.id
        LEFT JOIN attendance a ON a.course_id = c.id AND a.student_id = $1
        WHERE sc.student_id = $1
        GROUP BY c.id, c.code, c.name, c.department, c.credits, c.semester, c.description, c.faculty_name, sc.progress, sc.status
        ORDER BY c.code ASC;
    "#;

    let courses = EnrolledCourseView::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        sql,
        vec![student_id.into()],
    ))
    .all(&ctx.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    Ok(Json(courses))
}

pub async fn get_course(
    State(ctx): State<AppContext>,
    AuthUser(_claims): AuthUser,
    Path(id): Path<i32>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let sql = r#"
        SELECT id, code, name, department, credits, semester, description, faculty_name
        FROM courses
        WHERE id = $1;
    "#;

    let course = Course::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        sql,
        vec![id.into()],
    ))
    .one(&ctx.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
    .ok_or((StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Course not found" }))))?;

    Ok(Json(course))
}
