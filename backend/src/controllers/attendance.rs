use crate::models::{
    auth::AuthUser,
    entities::{
        AttendanceOverallSummary, AttendanceRecord, AttendanceSubjectSummary, MonthlyAttendance,
    },
};
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
        .prefix("/api/attendance")
        .add("", get(list_attendance))
        .add("/summary", get(get_attendance_summary))
}

pub async fn list_attendance(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let student_id = claims.student_id.unwrap_or(1);

    let sql = r#"
        SELECT id, student_id, course_id, subject_name, date, status, remarks
        FROM attendance
        WHERE student_id = $1
        ORDER BY date DESC, id DESC;
    "#;

    let records = AttendanceRecord::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        sql,
        vec![student_id.into()],
    ))
    .all(&ctx.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    Ok(Json(records))
}

pub async fn get_attendance_summary(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let student_id = claims.student_id.unwrap_or(1);

    // 1. Overall Attendance
    let overall_sql = r#"
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'Present' OR status = 'Excused') as attended,
            COUNT(*) FILTER (WHERE status = 'Absent') as absent
        FROM attendance
        WHERE student_id = $1;
    "#;
    let overall_row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            overall_sql,
            vec![student_id.into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    let (total_classes, attended_classes, absent_classes, overall_percentage) = if let Some(r) = overall_row {
        let total: i64 = r.try_get_by_index(0).unwrap_or(0);
        let attended: i64 = r.try_get_by_index(1).unwrap_or(0);
        let absent: i64 = r.try_get_by_index(2).unwrap_or(0);
        let pct = if total > 0 {
            ((attended as f64 / total as f64) * 1000.0).round() / 10.0
        } else {
            100.0
        };
        (total, attended, absent, pct)
    } else {
        (0, 0, 0, 100.0)
    };

    // 2. Subject Breakdown
    let subject_sql = r#"
        SELECT 
            subject_name,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'Present' OR status = 'Excused') as attended,
            COUNT(*) FILTER (WHERE status = 'Absent') as absent,
            CASE 
                WHEN COUNT(*) > 0 THEN 
                    ROUND((COUNT(*) FILTER (WHERE status = 'Present' OR status = 'Excused')::numeric / COUNT(*)::numeric) * 100, 1)::float8
                ELSE 100.0
            END as percentage
        FROM attendance
        WHERE student_id = $1
        GROUP BY subject_name
        ORDER BY subject_name ASC;
    "#;
    let subject_rows = ctx
        .db
        .query_all_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            subject_sql,
            vec![student_id.into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    let mut subject_breakdown = Vec::new();
    for r in subject_rows {
        subject_breakdown.push(AttendanceSubjectSummary {
            subject_name: r.try_get_by_index(0).unwrap_or_default(),
            total_classes: r.try_get_by_index(1).unwrap_or(0),
            attended_classes: r.try_get_by_index(2).unwrap_or(0),
            absent_classes: r.try_get_by_index(3).unwrap_or(0),
            percentage: r.try_get_by_index(4).unwrap_or(100.0),
        });
    }

    // 3. Monthly Trend
    let monthly_sql = r#"
        SELECT 
            TO_CHAR(date, 'Mon YYYY') as month_label,
            COUNT(*) FILTER (WHERE status = 'Present' OR status = 'Excused') as attended,
            COUNT(*) as total,
            CASE 
                WHEN COUNT(*) > 0 THEN 
                    ROUND((COUNT(*) FILTER (WHERE status = 'Present' OR status = 'Excused')::numeric / COUNT(*)::numeric) * 100, 1)::float8
                ELSE 100.0
            END as percentage
        FROM attendance
        WHERE student_id = $1
        GROUP BY TO_CHAR(date, 'Mon YYYY'), DATE_TRUNC('month', date)
        ORDER BY DATE_TRUNC('month', date) ASC;
    "#;
    let monthly_rows = ctx
        .db
        .query_all_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            monthly_sql,
            vec![student_id.into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    let mut monthly_stats = Vec::new();
    for r in monthly_rows {
        monthly_stats.push(MonthlyAttendance {
            month: r.try_get_by_index(0).unwrap_or_default(),
            attended: r.try_get_by_index(1).unwrap_or(0),
            total: r.try_get_by_index(2).unwrap_or(0),
            percentage: r.try_get_by_index(3).unwrap_or(100.0),
        });
    }

    Ok(Json(AttendanceOverallSummary {
        total_classes,
        attended_classes,
        absent_classes,
        overall_percentage,
        subject_breakdown,
        monthly_stats,
    }))
}
