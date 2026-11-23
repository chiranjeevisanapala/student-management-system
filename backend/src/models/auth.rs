use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: i32,
    pub email: String,
    pub role: String,
    pub name: String,
    pub student_id: Option<i32>,
    pub roll_number: Option<String>,
    pub exp: usize,
}

pub fn hash_password(password: &str) -> std::result::Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| e.to_string())
}

pub fn verify_password(password: &str, hash: &str) -> bool {
    if let Ok(parsed_hash) = PasswordHash::new(hash) {
        Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok()
    } else {
        false
    }
}

pub fn create_jwt(claims: &Claims, secret: &str) -> std::result::Result<String, jsonwebtoken::errors::Error> {
    encode(
        &Header::default(),
        claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}

pub fn verify_jwt(token: &str, secret: &str) -> std::result::Result<Claims, jsonwebtoken::errors::Error> {
    let mut validation = Validation::default();
    validation.validate_exp = true;
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )?;
    Ok(token_data.claims)
}

pub fn get_jwt_secret(_ctx: &loco_rs::app::AppContext) -> String {
    std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "student_management_super_secure_jwt_secret_key_2026_modern_portal".to_string())
}

// Extractor for any authenticated user
#[derive(Debug, Clone)]
pub struct AuthUser(pub Claims);

impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, axum::Json<serde_json::Value>);

    async fn from_request_parts(
        parts: &mut Parts,
        _state: &S,
    ) -> std::result::Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|h| h.to_str().ok());

        let token = match auth_header {
            Some(header) if header.starts_with("Bearer ") => &header[7..],
            _ => {
                return Err((
                    StatusCode::UNAUTHORIZED,
                    axum::Json(serde_json::json!({
                        "error": "Missing or invalid authorization header"
                    })),
                ))
            }
        };

        let secret = std::env::var("JWT_SECRET")
            .unwrap_or_else(|_| "student_management_super_secure_jwt_secret_key_2026_modern_portal".to_string());

        match verify_jwt(token, &secret) {
            Ok(claims) => Ok(AuthUser(claims)),
            Err(e) => Err((
                StatusCode::UNAUTHORIZED,
                axum::Json(serde_json::json!({
                    "error": format!("Invalid token: {}", e)
                })),
            )),
        }
    }
}

// Extractor for Admin only
#[derive(Debug, Clone)]
pub struct AdminUser(pub Claims);

impl<S> FromRequestParts<S> for AdminUser
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, axum::Json<serde_json::Value>);

    async fn from_request_parts(
        parts: &mut Parts,
        state: &S,
    ) -> std::result::Result<Self, Self::Rejection> {
        let AuthUser(claims) = AuthUser::from_request_parts(parts, state).await?;
        if claims.role == "admin" {
            Ok(AdminUser(claims))
        } else {
            Err((
                StatusCode::FORBIDDEN,
                axum::Json(serde_json::json!({
                    "error": "Administrator privilege required"
                })),
            ))
        }
    }
}

// Extractor for Faculty or Admin
#[derive(Debug, Clone)]
pub struct FacultyUser(pub Claims);

impl<S> FromRequestParts<S> for FacultyUser
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, axum::Json<serde_json::Value>);

    async fn from_request_parts(
        parts: &mut Parts,
        state: &S,
    ) -> std::result::Result<Self, Self::Rejection> {
        let AuthUser(claims) = AuthUser::from_request_parts(parts, state).await?;
        if claims.role == "faculty" || claims.role == "admin" {
            Ok(FacultyUser(claims))
        } else {
            Err((
                StatusCode::FORBIDDEN,
                axum::Json(serde_json::json!({
                    "error": "Faculty privilege required"
                })),
            ))
        }
    }
}
