use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let sql = r#"
        -- 1. Users table
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'student',
            name VARCHAR(255) NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

        -- 2. Students profile
        CREATE TABLE IF NOT EXISTS students (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            roll_number VARCHAR(100) NOT NULL UNIQUE,
            phone VARCHAR(50),
            department VARCHAR(100) NOT NULL,
            course VARCHAR(100) NOT NULL,
            academic_year VARCHAR(50) NOT NULL,
            semester INTEGER NOT NULL DEFAULT 1,
            join_date DATE NOT NULL DEFAULT CURRENT_DATE,
            avatar_url VARCHAR(500),
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_students_roll ON students(roll_number);
        CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);

        -- 3. Faculty profile
        CREATE TABLE IF NOT EXISTS faculty (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            employee_id VARCHAR(100) NOT NULL UNIQUE,
            phone VARCHAR(50),
            department VARCHAR(100) NOT NULL,
            designation VARCHAR(100) NOT NULL DEFAULT 'Assistant Professor',
            qualification VARCHAR(100) NOT NULL DEFAULT 'Ph.D / M.Tech',
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- 4. Departments
        CREATE TABLE IF NOT EXISTS departments (
            id SERIAL PRIMARY KEY,
            code VARCHAR(50) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- 5. Courses
        CREATE TABLE IF NOT EXISTS courses (
            id SERIAL PRIMARY KEY,
            code VARCHAR(50) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            department VARCHAR(100) NOT NULL,
            credits INTEGER NOT NULL DEFAULT 4,
            semester INTEGER NOT NULL DEFAULT 1,
            description TEXT,
            faculty_name VARCHAR(255) NOT NULL DEFAULT 'Dr. Senior Professor',
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- 6. Subjects
        CREATE TABLE IF NOT EXISTS subjects (
            id SERIAL PRIMARY KEY,
            code VARCHAR(50) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
            credits INTEGER NOT NULL DEFAULT 4,
            semester INTEGER NOT NULL DEFAULT 1,
            faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- 7. Student Courses (Enrollments)
        CREATE TABLE IF NOT EXISTS student_courses (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            semester INTEGER NOT NULL DEFAULT 1,
            academic_year VARCHAR(50) NOT NULL DEFAULT '2026-2027',
            status VARCHAR(50) NOT NULL DEFAULT 'Enrolled',
            progress INTEGER NOT NULL DEFAULT 65,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_student_course UNIQUE (student_id, course_id)
        );

        -- 8. Assignments
        CREATE TABLE IF NOT EXISTS assignments (
            id SERIAL PRIMARY KEY,
            course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
            subject_name VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            faculty_name VARCHAR(255) NOT NULL,
            assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
            due_date DATE NOT NULL,
            max_marks INTEGER NOT NULL DEFAULT 100,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- 9. Assignment Submissions
        CREATE TABLE IF NOT EXISTS assignment_submissions (
            id SERIAL PRIMARY KEY,
            assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            submission_text TEXT,
            file_url VARCHAR(500),
            file_name VARCHAR(255),
            submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            marks INTEGER,
            feedback TEXT,
            status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_assignment_student UNIQUE (assignment_id, student_id)
        );

        -- 10. Attendance Records
        CREATE TABLE IF NOT EXISTS attendance (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
            subject_name VARCHAR(255) NOT NULL,
            date DATE NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'Present',
            remarks VARCHAR(255),
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
        CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

        -- 11. Timetable
        CREATE TABLE IF NOT EXISTS timetable (
            id SERIAL PRIMARY KEY,
            course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
            day_of_week VARCHAR(50) NOT NULL,
            subject_name VARCHAR(255) NOT NULL,
            faculty_name VARCHAR(255) NOT NULL,
            classroom VARCHAR(100) NOT NULL,
            start_time VARCHAR(20) NOT NULL,
            end_time VARCHAR(20) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- 12. Examinations
        CREATE TABLE IF NOT EXISTS examinations (
            id SERIAL PRIMARY KEY,
            course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
            subject_name VARCHAR(255) NOT NULL,
            exam_name VARCHAR(255) NOT NULL,
            exam_type VARCHAR(100) NOT NULL DEFAULT 'Final Examination',
            exam_date DATE NOT NULL,
            start_time VARCHAR(20) NOT NULL,
            end_time VARCHAR(20) NOT NULL,
            exam_hall VARCHAR(100) NOT NULL,
            instructions TEXT,
            is_completed BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- 13. Results
        CREATE TABLE IF NOT EXISTS results (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
            subject_name VARCHAR(255) NOT NULL,
            semester INTEGER NOT NULL DEFAULT 1,
            internal_marks NUMERIC(5,2) NOT NULL DEFAULT 0,
            external_marks NUMERIC(5,2) NOT NULL DEFAULT 0,
            total_marks NUMERIC(5,2) NOT NULL DEFAULT 0,
            grade VARCHAR(10) NOT NULL DEFAULT 'A',
            pass_status VARCHAR(20) NOT NULL DEFAULT 'PASS',
            sgpa NUMERIC(4,2) NOT NULL DEFAULT 8.50,
            cgpa NUMERIC(4,2) NOT NULL DEFAULT 8.65,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);

        -- 14. Study Materials
        CREATE TABLE IF NOT EXISTS study_materials (
            id SERIAL PRIMARY KEY,
            course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
            subject_name VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            material_type VARCHAR(50) NOT NULL DEFAULT 'pdf',
            file_url VARCHAR(500) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_size VARCHAR(50) NOT NULL DEFAULT '2.4 MB',
            uploaded_by VARCHAR(255) NOT NULL DEFAULT 'Faculty',
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- 15. Announcements
        CREATE TABLE IF NOT EXISTS announcements (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            target_audience VARCHAR(50) NOT NULL DEFAULT 'all',
            department VARCHAR(100),
            author_name VARCHAR(255) NOT NULL DEFAULT 'Dean of Academic Affairs',
            is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- 16. Student Requests
        CREATE TABLE IF NOT EXISTS student_requests (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            request_type VARCHAR(100) NOT NULL,
            description TEXT NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'Pending',
            remarks TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_requests_student ON student_requests(student_id);

        -- 17. Request History
        CREATE TABLE IF NOT EXISTS request_history (
            id SERIAL PRIMARY KEY,
            request_id INTEGER NOT NULL REFERENCES student_requests(id) ON DELETE CASCADE,
            action VARCHAR(100) NOT NULL,
            changed_by VARCHAR(255) NOT NULL,
            notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- 18. Notifications
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            notification_type VARCHAR(50) NOT NULL DEFAULT 'general',
            link VARCHAR(255),
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

        -- 19. Password Reset Tokens
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token VARCHAR(255) NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL,
            used BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        "#;

        let db = manager.get_connection();
        db.execute_unprepared(sql).await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let sql = r#"
        DROP TABLE IF EXISTS password_reset_tokens CASCADE;
        DROP TABLE IF EXISTS notifications CASCADE;
        DROP TABLE IF EXISTS request_history CASCADE;
        DROP TABLE IF EXISTS student_requests CASCADE;
        DROP TABLE IF EXISTS announcements CASCADE;
        DROP TABLE IF EXISTS study_materials CASCADE;
        DROP TABLE IF EXISTS results CASCADE;
        DROP TABLE IF EXISTS examinations CASCADE;
        DROP TABLE IF EXISTS timetable CASCADE;
        DROP TABLE IF EXISTS attendance CASCADE;
        DROP TABLE IF EXISTS assignment_submissions CASCADE;
        DROP TABLE IF EXISTS assignments CASCADE;
        DROP TABLE IF EXISTS student_courses CASCADE;
        DROP TABLE IF EXISTS subjects CASCADE;
        DROP TABLE IF EXISTS courses CASCADE;
        DROP TABLE IF EXISTS departments CASCADE;
        DROP TABLE IF EXISTS faculty CASCADE;
        DROP TABLE IF EXISTS students CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        "#;
        let db = manager.get_connection();
        db.execute_unprepared(sql).await?;
        Ok(())
    }
}
