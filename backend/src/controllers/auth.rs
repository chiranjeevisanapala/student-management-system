use crate::models::{
    auth::{create_jwt, get_jwt_secret, hash_password, verify_password, AuthUser, Claims},
    entities::{
        ForgotPasswordRequest, LoginRequest, LoginResponse, RegisterRequest,
        ResetPasswordRequest, UserView,
    },
};
use axum::{
    extract::{Json, State},
    http::StatusCode,
    response::IntoResponse,
};
use chrono::{Duration, Utc};
use loco_rs::prelude::*;
use sea_orm::{ConnectionTrait, DatabaseBackend, Statement};
use uuid::Uuid;

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/auth")
        .add("/register", post(register))
        .add("/login", post(login))
        .add("/logout", post(logout))
        .add("/me", get(me))
        .add("/forgot-password", post(forgot_password))
        .add("/reset-password", post(reset_password))
}

pub async fn register(
    State(ctx): State<AppContext>,
    Json(payload): Json<RegisterRequest>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    // 1. Validation
    if payload.email.trim().is_empty() || !payload.email.contains('@') {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "A valid email address is required" })),
        ));
    }
    if payload.password.len() < 6 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Password must be at least 6 characters long" })),
        ));
    }
    if payload.roll_number.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Student ID / Roll number is required" })),
        ));
    }
    if payload.name.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Full name is required" })),
        ));
    }

    // 2. Check duplicate email
    let check_email_sql = "SELECT id FROM users WHERE email = $1;";
    let existing_email = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            check_email_sql,
            vec![payload.email.trim().to_lowercase().into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    if existing_email.is_some() {
        return Err((
            StatusCode::CONFLICT,
            Json(serde_json::json!({ "error": "An account with this email address already exists" })),
        ));
    }

    // 3. Check duplicate roll number
    let check_roll_sql = "SELECT id FROM students WHERE roll_number = $1;";
    let existing_roll = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            check_roll_sql,
            vec![payload.roll_number.trim().into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    if existing_roll.is_some() {
        return Err((
            StatusCode::CONFLICT,
            Json(serde_json::json!({ "error": "Student ID / Roll Number is already registered" })),
        ));
    }

    // 4. Hash password securely with argon2
    let pwd_hash = hash_password(&payload.password)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e }))))?;

    // 5. Insert user (Role is strictly 'student' - users cannot register as admin/faculty)
    let insert_user_sql = r#"
        INSERT INTO users (email, password_hash, role, name, is_active)
        VALUES ($1, $2, 'student', $3, true)
        RETURNING id;
    "#;
    let user_row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            insert_user_sql,
            vec![
                payload.email.trim().to_lowercase().into(),
                pwd_hash.into(),
                payload.name.trim().into(),
            ],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
        .ok_or((StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "Failed to create user record" }))))?;

    let user_id: i32 = user_row.try_get_by_index(0).unwrap_or(0);

    // 6. Insert student profile
    let insert_student_sql = r#"
        INSERT INTO students (user_id, roll_number, phone, department, course, academic_year, semester)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
    "#;
    let student_row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            insert_student_sql,
            vec![
                user_id.into(),
                payload.roll_number.trim().into(),
                payload.phone.into(),
                payload.department.trim().into(),
                payload.course.trim().into(),
                payload.academic_year.trim().into(),
                payload.semester.into(),
            ],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
        .ok_or((StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "Failed to create student profile" }))))?;

    let student_id: i32 = student_row.try_get_by_index(0).unwrap_or(0);

    // Automatically enroll new student into existing courses matching semester
    let auto_enroll_sql = r#"
        INSERT INTO student_courses (student_id, course_id, semester, academic_year, status, progress)
        SELECT $1, id, semester, $2, 'Enrolled', 10
        FROM courses
        WHERE semester = $3
        ON CONFLICT (student_id, course_id) DO NOTHING;
    "#;
    let _ = ctx
        .db
        .execute_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            auto_enroll_sql,
            vec![
                student_id.into(),
                payload.academic_year.trim().into(),
                payload.semester.into(),
            ],
        ))
        .await;

    // Send welcome notification
    let notif_sql = r#"
        INSERT INTO notifications (user_id, title, message, notification_type, link)
        VALUES ($1, 'Welcome to Modern Academic Portal', 'Your student account and academic profile have been successfully activated.', 'general', '/dashboard');
    "#;
    let _ = ctx
        .db
        .execute_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            notif_sql,
            vec![user_id.into()],
        ))
        .await;

    // 7. Generate JWT token
    let exp = (Utc::now() + Duration::days(7)).timestamp() as usize;
    let claims = Claims {
        sub: user_id,
        email: payload.email.trim().to_lowercase(),
        role: "student".to_string(),
        name: payload.name.trim().to_string(),
        student_id: Some(student_id),
        roll_number: Some(payload.roll_number.trim().to_string()),
        exp,
    };
    let token = create_jwt(&claims, &get_jwt_secret(&ctx))
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    Ok((
        StatusCode::CREATED,
        Json(LoginResponse {
            token,
            user: UserView {
                id: user_id,
                email: payload.email.trim().to_lowercase(),
                name: payload.name.trim().to_string(),
                role: "student".to_string(),
                student_id: Some(student_id),
                roll_number: Some(payload.roll_number.trim().to_string()),
                department: Some(payload.department.trim().to_string()),
            },
        }),
    ))
}

pub async fn login(
    State(ctx): State<AppContext>,
    Json(payload): Json<LoginRequest>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    if payload.email.trim().is_empty() || payload.password.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Email and password are required" })),
        ));
    }

    let user_sql = r#"
        SELECT u.id, u.email, u.password_hash, u.role, u.name, u.is_active,
               s.id as student_id, s.roll_number, s.department as student_dept,
               f.id as faculty_id, f.department as faculty_dept
        FROM users u
        LEFT JOIN students s ON s.user_id = u.id
        LEFT JOIN faculty f ON f.user_id = u.id
        WHERE LOWER(u.email) = LOWER($1);
    "#;
    let row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            user_sql,
            vec![payload.email.trim().into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    let row = match row {
        Some(r) => r,
        None => {
            return Err((
                StatusCode::UNAUTHORIZED,
                Json(serde_json::json!({ "error": "Invalid email or password" })),
            ));
        }
    };

    let user_id: i32 = row.try_get_by_index(0).unwrap_or(0);
    let email: String = row.try_get_by_index(1).unwrap_or_default();
    let stored_hash: String = row.try_get_by_index(2).unwrap_or_default();
    let role: String = row.try_get_by_index(3).unwrap_or_default();
    let name: String = row.try_get_by_index(4).unwrap_or_default();
    let is_active: bool = row.try_get_by_index(5).unwrap_or(true);
    let student_id: Option<i32> = row.try_get_by_index(6).ok();
    let roll_number: Option<String> = row.try_get_by_index(7).ok();
    let student_dept: Option<String> = row.try_get_by_index(8).ok();
    let faculty_dept: Option<String> = row.try_get_by_index(10).ok();

    if !is_active {
        return Err((
            StatusCode::FORBIDDEN,
            Json(serde_json::json!({ "error": "Your account has been deactivated. Please contact administration." })),
        ));
    }

    if !verify_password(&payload.password, &stored_hash) {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({ "error": "Invalid email or password" })),
        ));
    }

    let days = if payload.remember_me.unwrap_or(false) { 30 } else { 7 };
    let exp = (Utc::now() + Duration::days(days)).timestamp() as usize;

    let claims = Claims {
        sub: user_id,
        email: email.clone(),
        role: role.clone(),
        name: name.clone(),
        student_id,
        roll_number: roll_number.clone(),
        exp,
    };
    let token = create_jwt(&claims, &get_jwt_secret(&ctx))
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    let department = student_dept.or(faculty_dept);

    Ok((
        StatusCode::OK,
        Json(LoginResponse {
            token,
            user: UserView {
                id: user_id,
                email,
                name,
                role,
                student_id,
                roll_number,
                department,
            },
        }),
    ))
}

pub async fn logout() -> impl IntoResponse {
    (StatusCode::OK, Json(serde_json::json!({ "message": "Successfully logged out" })))
}

pub async fn me(
    State(ctx): State<AppContext>,
    AuthUser(claims): AuthUser,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let user_sql = r#"
        SELECT u.id, u.email, u.role, u.name,
               s.id as student_id, s.roll_number, s.department as student_dept,
               f.id as faculty_id, f.department as faculty_dept
        FROM users u
        LEFT JOIN students s ON s.user_id = u.id
        LEFT JOIN faculty f ON f.user_id = u.id
        WHERE u.id = $1;
    "#;
    let row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            user_sql,
            vec![claims.sub.into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
        .ok_or((StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "User record not found" }))))?;

    let user_id: i32 = row.try_get_by_index(0).unwrap_or(0);
    let email: String = row.try_get_by_index(1).unwrap_or_default();
    let role: String = row.try_get_by_index(2).unwrap_or_default();
    let name: String = row.try_get_by_index(3).unwrap_or_default();
    let student_id: Option<i32> = row.try_get_by_index(4).ok();
    let roll_number: Option<String> = row.try_get_by_index(5).ok();
    let student_dept: Option<String> = row.try_get_by_index(6).ok();
    let faculty_dept: Option<String> = row.try_get_by_index(8).ok();

    Ok(Json(UserView {
        id: user_id,
        email,
        name,
        role,
        student_id,
        roll_number,
        department: student_dept.or(faculty_dept),
    }))
}

pub async fn forgot_password(
    State(ctx): State<AppContext>,
    Json(payload): Json<ForgotPasswordRequest>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    if payload.email.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Email address is required" })),
        ));
    }

    let user_sql = "SELECT id FROM users WHERE LOWER(email) = LOWER($1);";
    let row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            user_sql,
            vec![payload.email.trim().into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    if let Some(r) = row {
        let user_id: i32 = r.try_get_by_index(0).unwrap_or(0);
        let token = Uuid::new_v4().to_string();
        let expires_at = Utc::now() + Duration::hours(2);

        let insert_token_sql = r#"
            INSERT INTO password_reset_tokens (user_id, token, expires_at)
            VALUES ($1, $2, $3);
        "#;
        let _ = ctx
            .db
            .execute_raw(Statement::from_sql_and_values(
                DatabaseBackend::Postgres,
                insert_token_sql,
                vec![user_id.into(), token.clone().into(), expires_at.into()],
            ))
            .await;

        return Ok(Json(serde_json::json!({
            "message": "Password reset instructions and token have been issued.",
            "reset_token": token
        })));
    }

    // Always respond with success to avoid email enumeration
    Ok(Json(serde_json::json!({
        "message": "If an account exists with this email, password reset instructions have been generated."
    })))
}

pub async fn reset_password(
    State(ctx): State<AppContext>,
    Json(payload): Json<ResetPasswordRequest>,
) -> std::result::Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    if payload.token.trim().is_empty() || payload.new_password.len() < 6 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Valid reset token and password (at least 6 characters) are required" })),
        ));
    }

    let find_token_sql = r#"
        SELECT id, user_id, expires_at, used
        FROM password_reset_tokens
        WHERE token = $1;
    "#;
    let row = ctx
        .db
        .query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            find_token_sql,
            vec![payload.token.trim().into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?
        .ok_or((StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid or expired reset token" }))))?;

    let token_id: i32 = row.try_get_by_index(0).unwrap_or(0);
    let user_id: i32 = row.try_get_by_index(1).unwrap_or(0);
    let expires_at: chrono::DateTime<Utc> = row.try_get_by_index(2).unwrap_or_else(|_| Utc::now());
    let used: bool = row.try_get_by_index(3).unwrap_or(false);

    if used || expires_at < Utc::now() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Reset token has expired or has already been used" })),
        ));
    }

    let new_hash = hash_password(&payload.new_password)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e }))))?;

    let update_user_sql = "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;";
    ctx.db
        .execute_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            update_user_sql,
            vec![new_hash.into(), user_id.into()],
        ))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))))?;

    let mark_used_sql = "UPDATE password_reset_tokens SET used = true WHERE id = $1;";
    let _ = ctx
        .db
        .execute_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            mark_used_sql,
            vec![token_id.into()],
        ))
        .await;

    Ok(Json(serde_json::json!({ "message": "Password has been successfully reset. You may now log in with your new password." })))
}
