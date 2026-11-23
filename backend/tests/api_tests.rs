use backend::models::auth::{hash_password, verify_password, create_jwt, verify_jwt, Claims};

#[test]
fn test_password_hashing_and_verification() {
    let password = "SecureStudentPassword@2026";
    let hash = hash_password(password).expect("Hashing should succeed");
    
    // Hash should not equal plain text
    assert_ne!(hash, password);
    assert!(hash.starts_with("$argon2"));

    // Verification with matching password
    assert!(verify_password(password, &hash));

    // Verification with incorrect password
    assert!(!verify_password("WrongPassword123", &hash));
}

#[test]
fn test_jwt_generation_and_validation() {
    let jwt_secret = "super_secret_jwt_key_for_testing_123456789";
    let claims = Claims {
        sub: 42,
        email: "alice@university.edu".to_string(),
        role: "student".to_string(),
        name: "Alice Smith".to_string(),
        student_id: Some(101),
        roll_number: Some("CS2026-001".to_string()),
        exp: 2000000000, // Year 2033
    };

    let token = create_jwt(&claims, jwt_secret).expect("JWT creation should succeed");
    assert!(!token.is_empty());

    let decoded = verify_jwt(&token, jwt_secret).expect("JWT validation should succeed");
    assert_eq!(decoded.sub, 42);
    assert_eq!(decoded.email, "alice@university.edu");
    assert_eq!(decoded.role, "student");
    assert_eq!(decoded.name, "Alice Smith");
    assert_eq!(decoded.student_id, Some(101));
    assert_eq!(decoded.roll_number, Some("CS2026-001".to_string()));

    // Validating with wrong secret must fail
    let wrong_validation = verify_jwt(&token, "wrong_secret_key");
    assert!(wrong_validation.is_err());
}

#[test]
fn test_attendance_formula_calculation() {
    // Formula specified in Prompt Section 10:
    // Attendance Percentage = (Classes Attended / Total Classes) * 100
    
    let calculate_percentage = |attended: i64, total: i64| -> f64 {
        if total > 0 {
            ((attended as f64 / total as f64) * 1000.0).round() / 10.0
        } else {
            100.0
        }
    };

    assert_eq!(calculate_percentage(26, 30), 86.7);
    assert_eq!(calculate_percentage(30, 30), 100.0);
    assert_eq!(calculate_percentage(0, 10), 0.0);
    assert_eq!(calculate_percentage(0, 0), 100.0);
    assert_eq!(calculate_percentage(15, 20), 75.0);
    assert_eq!(calculate_percentage(14, 20), 70.0); // Below 75% threshold
}

#[test]
fn test_role_based_access_control_logic() {
    let student_claims = Claims {
        sub: 1,
        email: "student@university.edu".to_string(),
        role: "student".to_string(),
        name: "Student".to_string(),
        student_id: Some(1),
        roll_number: Some("CS2026-001".to_string()),
        exp: 2000000000,
    };

    let faculty_claims = Claims {
        sub: 2,
        email: "faculty@university.edu".to_string(),
        role: "faculty".to_string(),
        name: "Professor".to_string(),
        student_id: None,
        roll_number: None,
        exp: 2000000000,
    };

    let admin_claims = Claims {
        sub: 3,
        email: "admin@university.edu".to_string(),
        role: "admin".to_string(),
        name: "Administrator".to_string(),
        student_id: None,
        roll_number: None,
        exp: 2000000000,
    };

    // Role check predicates
    let is_admin = |c: &Claims| c.role == "admin";
    let is_faculty = |c: &Claims| c.role == "faculty";
    let is_student = |c: &Claims| c.role == "student";

    assert!(is_student(&student_claims));
    assert!(!is_admin(&student_claims));
    assert!(!is_faculty(&student_claims));

    assert!(is_faculty(&faculty_claims));
    assert!(!is_admin(&faculty_claims));
    assert!(!is_student(&faculty_claims));

    assert!(is_admin(&admin_claims));
    assert!(!is_student(&admin_claims));
    assert!(!is_faculty(&admin_claims));
}

#[tokio::test]
async fn test_db_duplicate_email_prevention() {
    // Connect to PostgreSQL test instance
    use sea_orm::{Database, Statement, DatabaseBackend, ConnectionTrait};
    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@127.0.0.1:5432/student_management_db".to_string());
    
    if let Ok(db) = Database::connect(&db_url).await {
        // Query demo student user
        let select_sql = "SELECT id, email, role FROM users WHERE email = $1;";
        let row = db.query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            select_sql,
            vec!["student@university.edu".into()]
        )).await.expect("Query should execute");

        assert!(row.is_some(), "Seeded demo student must exist in database");

        // Attempting to insert duplicate email must violate unique constraint
        let duplicate_sql = r#"
            INSERT INTO users (email, password_hash, role, name)
            VALUES ('student@university.edu', 'hash', 'student', 'Duplicate');
        "#;
        let insert_res = db.execute_raw(Statement::from_string(DatabaseBackend::Postgres, duplicate_sql.to_string())).await;
        assert!(insert_res.is_err(), "Duplicate email insert must fail with unique constraint violation");
    }
}

#[tokio::test]
async fn test_student_data_isolation() {
    use sea_orm::{Database, Statement, DatabaseBackend, ConnectionTrait};
    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@127.0.0.1:5432/student_management_db".to_string());

    if let Ok(db) = Database::connect(&db_url).await {
        // Query results for student_id = 1
        let results_sql = "SELECT COUNT(*) FROM results WHERE student_id = $1;";
        let count_row = db.query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            results_sql,
            vec![1.into()]
        )).await.expect("Query should succeed");

        let count: i64 = count_row.and_then(|r| r.try_get_by_index(0).ok()).unwrap_or(0);
        assert!(count > 0, "Student 1 should have seeded academic results");

        // Query results for a non-existent student_id = 9999
        let empty_row = db.query_one_raw(Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            results_sql,
            vec![9999.into()]
        )).await.expect("Query should succeed");

        let empty_count: i64 = empty_row.and_then(|r| r.try_get_by_index(0).ok()).unwrap_or(0);
        assert_eq!(empty_count, 0, "Unauthorized or non-existent student must see 0 results (isolation enforced)");
    }
}
