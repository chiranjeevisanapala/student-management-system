use crate::models::auth::hash_password;
use sea_orm::{ConnectionTrait, DatabaseConnection, DbErr, Statement};

pub async fn seed_database(db: &DatabaseConnection) -> Result<(), DbErr> {
    // Check if users table already has data
    let check_query = "SELECT COUNT(*) FROM users;";
    let row = db
        .query_one_raw(Statement::from_string(
            sea_orm::DatabaseBackend::Postgres,
            check_query.to_string(),
        ))
        .await?;

    if let Some(r) = row {
        let count: i64 = r.try_get_by_index(0).unwrap_or(0);
        if count > 0 {
            tracing::info!("Database already seeded with {} users. Skipping initial seed.", count);
            return Ok(());
        }
    }

    tracing::info!("Seeding database with comprehensive demo academic data...");

    let password_hash = hash_password("Password@123").map_err(|e| DbErr::Custom(e))?;

    // 1. Users
    let users_sql = format!(
        r#"
        INSERT INTO users (id, email, password_hash, role, name, is_active) VALUES
        (1, 'admin@university.edu', '{0}', 'admin', 'University Administrator', true),
        (2, 'faculty@university.edu', '{0}', 'faculty', 'Dr. Alan Turing', true),
        (3, 'student@university.edu', '{0}', 'student', 'Alex Morgan', true)
        ON CONFLICT (email) DO NOTHING;
        SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
        "#,
        password_hash
    );
    db.execute_unprepared(&users_sql).await?;

    // 2. Departments
    let depts_sql = r#"
        INSERT INTO departments (id, code, name, description) VALUES
        (1, 'CSE', 'Computer Science & Engineering', 'Department of Computer Science and Engineering'),
        (2, 'ECE', 'Electronics & Communication', 'Department of Electronics and Communication Engineering'),
        (3, 'IT', 'Information Technology', 'Department of Information Technology')
        ON CONFLICT (code) DO NOTHING;
        SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments));
    "#;
    db.execute_unprepared(depts_sql).await?;

    // 3. Faculty profile
    let faculty_sql = r#"
        INSERT INTO faculty (id, user_id, employee_id, phone, department, designation, qualification) VALUES
        (1, 2, 'FAC-1002', '+1 (555) 234-5678', 'Computer Science & Engineering', 'Professor & Department Head', 'Ph.D. in Computer Science')
        ON CONFLICT (employee_id) DO NOTHING;
        SELECT setval('faculty_id_seq', (SELECT MAX(id) FROM faculty));
    "#;
    db.execute_unprepared(faculty_sql).await?;

    // 4. Student profile
    let student_sql = r#"
        INSERT INTO students (id, user_id, roll_number, phone, department, course, academic_year, semester, join_date, avatar_url) VALUES
        (1, 3, 'CS2026-0042', '+1 (555) 987-6543', 'Computer Science & Engineering', 'B.Tech in Computer Science', '2026-2027', 6, '2023-08-15', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces')
        ON CONFLICT (roll_number) DO NOTHING;
        SELECT setval('students_id_seq', (SELECT MAX(id) FROM students));
    "#;
    db.execute_unprepared(student_sql).await?;

    // 5. Courses
    let courses_sql = r#"
        INSERT INTO courses (id, code, name, department, credits, semester, description, faculty_name) VALUES
        (1, 'CS601', 'Advanced Algorithms & Complexity', 'Computer Science & Engineering', 4, 6, 'Analysis of algorithms, dynamic programming, graph algorithms, and NP-completeness.', 'Dr. Alan Turing'),
        (2, 'CS602', 'Cloud Computing & Distributed Systems', 'Computer Science & Engineering', 4, 6, 'Architecture of modern cloud systems, microservices, containerization, and distributed consensus.', 'Dr. Alan Turing'),
        (3, 'CS603', 'Database Internals & Optimization', 'Computer Science & Engineering', 3, 6, 'Query execution engines, indexing, transaction processing, and distributed databases.', 'Prof. Margaret Hamilton'),
        (4, 'CS604', 'Machine Learning Foundations', 'Computer Science & Engineering', 4, 6, 'Supervised learning, deep neural networks, model optimization, and probabilistic models.', 'Dr. Geoffrey Hinton'),
        (5, 'CS605', 'Cybersecurity & Cryptography', 'Computer Science & Engineering', 3, 6, 'Network protocols, public key cryptography, zero-knowledge proofs, and secure system design.', 'Prof. Claude Shannon')
        ON CONFLICT (code) DO NOTHING;
        SELECT setval('courses_id_seq', (SELECT MAX(id) FROM courses));
    "#;
    db.execute_unprepared(courses_sql).await?;

    // 6. Enroll student into courses
    let student_courses_sql = r#"
        INSERT INTO student_courses (student_id, course_id, semester, academic_year, status, progress) VALUES
        (1, 1, 6, '2026-2027', 'Enrolled', 78),
        (1, 2, 6, '2026-2027', 'Enrolled', 85),
        (1, 3, 6, '2026-2027', 'Enrolled', 60),
        (1, 4, 6, '2026-2027', 'Enrolled', 72),
        (1, 5, 6, '2026-2027', 'Enrolled', 90)
        ON CONFLICT (student_id, course_id) DO NOTHING;
    "#;
    db.execute_unprepared(student_courses_sql).await?;

    // 7. Assignments
    let assignments_sql = r#"
        INSERT INTO assignments (id, course_id, subject_name, title, description, faculty_name, assigned_date, due_date, max_marks) VALUES
        (1, 1, 'Advanced Algorithms', 'Dynamic Programming Optimization & Min-Cut', 'Implement and benchmark Edmonds-Karp and Dinic max-flow algorithms with time complexity comparison.', 'Dr. Alan Turing', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '4 days', 100),
        (2, 2, 'Cloud Computing', 'Dockerized Microservices Architecture', 'Create a 3-tier containerized service with API gateway, Redis caching, and health-check monitoring.', 'Dr. Alan Turing', CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE + INTERVAL '2 days', 100),
        (3, 3, 'Database Internals', 'B+ Tree Index Implementation & Query Execution', 'Implement a disk-backed B+ tree index with concurrency support and benchmark read throughput.', 'Prof. Margaret Hamilton', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '2 days', 100),
        (4, 4, 'Machine Learning', 'Transformer Self-Attention from Scratch', 'Build a scaled dot-product multi-head attention module in PyTorch with positional encodings.', 'Dr. Geoffrey Hinton', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '8 days', 100)
        ON CONFLICT (id) DO NOTHING;
        SELECT setval('assignments_id_seq', (SELECT MAX(id) FROM assignments));
    "#;
    db.execute_unprepared(assignments_sql).await?;

    // 8. Assignment Submissions
    let submissions_sql = r#"
        INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, file_name, file_url, marks, feedback, status) VALUES
        (3, 1, 'Implemented B+ Tree with latch crabbing for thread safety. Verified 100,000 operations without deadlocks.', 'bplus_tree_impl.tar.gz', '/uploads/bplus_tree_impl.tar.gz', 94, 'Excellent implementation of latch crabbing and buffer pool integration!', 'Graded')
        ON CONFLICT (assignment_id, student_id) DO NOTHING;
    "#;
    db.execute_unprepared(submissions_sql).await?;

    // 9. Attendance records (Realistic history across subjects)
    let attendance_sql = r#"
        INSERT INTO attendance (student_id, course_id, subject_name, date, status, remarks) VALUES
        -- Advanced Algorithms
        (1, 1, 'Advanced Algorithms', CURRENT_DATE - INTERVAL '1 day', 'Present', 'Attended full lecture'),
        (1, 1, 'Advanced Algorithms', CURRENT_DATE - INTERVAL '3 days', 'Present', 'Attended full lecture'),
        (1, 1, 'Advanced Algorithms', CURRENT_DATE - INTERVAL '6 days', 'Present', 'Active in class discussion'),
        (1, 1, 'Advanced Algorithms', CURRENT_DATE - INTERVAL '8 days', 'Absent', 'Medical leave submitted'),
        (1, 1, 'Advanced Algorithms', CURRENT_DATE - INTERVAL '10 days', 'Present', 'Attended lab session'),
        (1, 1, 'Advanced Algorithms', CURRENT_DATE - INTERVAL '13 days', 'Present', 'Attended full lecture'),
        (1, 1, 'Advanced Algorithms', CURRENT_DATE - INTERVAL '15 days', 'Present', 'Attended full lecture'),
        (1, 1, 'Advanced Algorithms', CURRENT_DATE - INTERVAL '17 days', 'Present', 'Attended full lecture'),
        -- Cloud Computing
        (1, 2, 'Cloud Computing', CURRENT_DATE - INTERVAL '1 day', 'Present', 'Lab session completed'),
        (1, 2, 'Cloud Computing', CURRENT_DATE - INTERVAL '2 days', 'Present', 'Attended lecture'),
        (1, 2, 'Cloud Computing', CURRENT_DATE - INTERVAL '4 days', 'Present', 'Attended lecture'),
        (1, 2, 'Cloud Computing', CURRENT_DATE - INTERVAL '7 days', 'Present', 'Attended lecture'),
        (1, 2, 'Cloud Computing', CURRENT_DATE - INTERVAL '9 days', 'Present', 'Attended lecture'),
        (1, 2, 'Cloud Computing', CURRENT_DATE - INTERVAL '11 days', 'Present', 'Attended lecture'),
        (1, 2, 'Cloud Computing', CURRENT_DATE - INTERVAL '14 days', 'Absent', 'Unexcused'),
        -- Database Internals
        (1, 3, 'Database Internals', CURRENT_DATE - INTERVAL '2 days', 'Present', 'Attended lecture'),
        (1, 3, 'Database Internals', CURRENT_DATE - INTERVAL '5 days', 'Present', 'Attended lecture'),
        (1, 3, 'Database Internals', CURRENT_DATE - INTERVAL '8 days', 'Present', 'Attended lecture'),
        (1, 3, 'Database Internals', CURRENT_DATE - INTERVAL '12 days', 'Present', 'Attended lecture'),
        (1, 3, 'Database Internals', CURRENT_DATE - INTERVAL '16 days', 'Present', 'Attended lecture'),
        -- Machine Learning
        (1, 4, 'Machine Learning', CURRENT_DATE - INTERVAL '3 days', 'Present', 'Attended lecture'),
        (1, 4, 'Machine Learning', CURRENT_DATE - INTERVAL '4 days', 'Present', 'Attended lecture'),
        (1, 4, 'Machine Learning', CURRENT_DATE - INTERVAL '7 days', 'Absent', 'Approved leave'),
        (1, 4, 'Machine Learning', CURRENT_DATE - INTERVAL '10 days', 'Present', 'Attended lecture'),
        (1, 4, 'Machine Learning', CURRENT_DATE - INTERVAL '14 days', 'Present', 'Attended lecture'),
        -- Cybersecurity
        (1, 5, 'Cybersecurity', CURRENT_DATE - INTERVAL '1 day', 'Present', 'Attended lecture'),
        (1, 5, 'Cybersecurity', CURRENT_DATE - INTERVAL '5 days', 'Present', 'Attended lecture'),
        (1, 5, 'Cybersecurity', CURRENT_DATE - INTERVAL '8 days', 'Present', 'Attended lecture'),
        (1, 5, 'Cybersecurity', CURRENT_DATE - INTERVAL '11 days', 'Present', 'Attended lecture'),
        (1, 5, 'Cybersecurity', CURRENT_DATE - INTERVAL '15 days', 'Present', 'Attended lecture');
    "#;
    db.execute_unprepared(attendance_sql).await?;

    // 10. Timetable (Weekly Monday through Saturday)
    let timetable_sql = r#"
        INSERT INTO timetable (course_id, day_of_week, subject_name, faculty_name, classroom, start_time, end_time) VALUES
        (1, 'Monday', 'Advanced Algorithms', 'Dr. Alan Turing', 'Hall 302 - Turing Block', '09:00 AM', '10:30 AM'),
        (2, 'Monday', 'Cloud Computing', 'Dr. Alan Turing', 'Lab 4 - Cloud Tech Wing', '11:00 AM', '12:30 PM'),
        (3, 'Monday', 'Database Internals', 'Prof. Margaret Hamilton', 'Hall 204 - Systems Center', '02:00 PM', '03:30 PM'),
        
        (4, 'Tuesday', 'Machine Learning', 'Dr. Geoffrey Hinton', 'Seminar Hall 1', '09:30 AM', '11:00 AM'),
        (5, 'Tuesday', 'Cybersecurity', 'Prof. Claude Shannon', 'Lab 2 - Security Center', '11:30 AM', '01:00 PM'),
        (1, 'Tuesday', 'Advanced Algorithms Lab', 'Dr. Alan Turing', 'Lab 1 - CS Main', '02:00 PM', '04:00 PM'),
        
        (2, 'Wednesday', 'Cloud Computing', 'Dr. Alan Turing', 'Hall 302 - Turing Block', '09:00 AM', '10:30 AM'),
        (3, 'Wednesday', 'Database Internals', 'Prof. Margaret Hamilton', 'Hall 204 - Systems Center', '11:00 AM', '12:30 PM'),
        (4, 'Wednesday', 'Machine Learning Workshop', 'Dr. Geoffrey Hinton', 'AI Research Lab', '02:00 PM', '04:00 PM'),
        
        (5, 'Thursday', 'Cybersecurity', 'Prof. Claude Shannon', 'Hall 105 - Shannon Center', '09:00 AM', '10:30 AM'),
        (1, 'Thursday', 'Advanced Algorithms', 'Dr. Alan Turing', 'Hall 302 - Turing Block', '11:00 AM', '12:30 PM'),
        (2, 'Thursday', 'Cloud Systems Practicum', 'Dr. Alan Turing', 'Cloud Lab 4', '02:00 PM', '04:00 PM'),
        
        (3, 'Friday', 'Database Optimization Lab', 'Prof. Margaret Hamilton', 'Database Lab 3', '09:30 AM', '11:30 AM'),
        (4, 'Friday', 'Machine Learning', 'Dr. Geoffrey Hinton', 'Seminar Hall 1', '01:30 PM', '03:00 PM'),
        (5, 'Friday', 'Cybersecurity Seminar', 'Prof. Claude Shannon', 'Auditorium B', '03:30 PM', '05:00 PM'),
        
        (1, 'Saturday', 'Mentorship & Project Review', 'Faculty Committee', 'Innovation Hub', '10:00 AM', '01:00 PM');
    "#;
    db.execute_unprepared(timetable_sql).await?;

    // 11. Examinations (Upcoming and Completed)
    let exams_sql = r#"
        INSERT INTO examinations (course_id, subject_name, exam_name, exam_type, exam_date, start_time, end_time, exam_hall, instructions, is_completed) VALUES
        (1, 'Advanced Algorithms', 'Mid-Semester Theory Examination', 'Midterm Examination', CURRENT_DATE - INTERVAL '30 days', '09:30 AM', '12:30 PM', 'Examination Hall 1A', 'Calculators permitted. Closed books and notes.', true),
        (2, 'Cloud Computing', 'Mid-Semester Practical Examination', 'Practical Examination', CURRENT_DATE - INTERVAL '25 days', '02:00 PM', '05:00 PM', 'Lab 4 - Cloud Tech Wing', 'Live cluster deployment scenario. Internet access restricted to documentation.', true),
        (1, 'Advanced Algorithms', 'End-Semester Final Examination', 'Final Examination', CURRENT_DATE + INTERVAL '12 days', '09:30 AM', '12:30 PM', 'Examination Hall 2B', 'Bring student ID card and official admit slip. No electronic gadgets allowed.', false),
        (2, 'Cloud Computing', 'End-Semester Final Examination', 'Final Examination', CURRENT_DATE + INTERVAL '15 days', '09:30 AM', '12:30 PM', 'Examination Hall 2B', 'Comprehensive assessment covering all 5 syllabus modules.', false),
        (3, 'Database Internals', 'End-Semester Final Examination', 'Final Examination', CURRENT_DATE + INTERVAL '18 days', '02:00 PM', '05:00 PM', 'Examination Hall 1A', 'Standard university examination protocols apply strictly.', false),
        (4, 'Machine Learning', 'End-Semester Final Examination', 'Final Examination', CURRENT_DATE + INTERVAL '21 days', '09:30 AM', '12:30 PM', 'Main Auditorium Hall', 'Answer any 5 out of 8 comprehensive analytical questions.', false);
    "#;
    db.execute_unprepared(exams_sql).await?;

    // 12. Results (Subject marks, SGPA, CGPA)
    let results_sql = r#"
        INSERT INTO results (student_id, course_id, subject_name, semester, internal_marks, external_marks, total_marks, grade, pass_status, sgpa, cgpa) VALUES
        (1, 1, 'Advanced Algorithms & Complexity', 5, 28.5, 62.0, 90.5, 'A+', 'PASS', 8.80, 8.75),
        (1, 2, 'Cloud Computing Architecture', 5, 27.0, 59.5, 86.5, 'A', 'PASS', 8.80, 8.75),
        (1, 3, 'Database Management Systems', 5, 29.0, 64.0, 93.0, 'O', 'PASS', 8.80, 8.75),
        (1, 4, 'Computer Networks & Protocols', 5, 26.5, 58.0, 84.5, 'A', 'PASS', 8.80, 8.75),
        (1, 5, 'Software Engineering Principles', 5, 28.0, 60.0, 88.0, 'A+', 'PASS', 8.80, 8.75);
    "#;
    db.execute_unprepared(results_sql).await?;

    // 13. Study Materials
    let materials_sql = r#"
        INSERT INTO study_materials (course_id, subject_name, title, material_type, file_url, file_name, file_size, uploaded_by) VALUES
        (1, 'Advanced Algorithms', 'Lecture 1-6: Graph Min-Cut & Max-Flow Formulations', 'pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Algorithms_Graph_Theory.pdf', '4.2 MB', 'Dr. Alan Turing'),
        (1, 'Advanced Algorithms', 'Dynamic Programming Optimization Handbook', 'notes', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'DP_Optimization_Notes.pdf', '2.8 MB', 'Dr. Alan Turing'),
        (2, 'Cloud Computing', 'Microservice Patterns & Kubernetes Deployment Guide', 'pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Kubernetes_Architecture.pdf', '6.1 MB', 'Dr. Alan Turing'),
        (2, 'Cloud Computing', 'Lecture Slides: Distributed Consensus (Raft & Paxos)', 'presentation', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Distributed_Consensus_Slides.pdf', '5.4 MB', 'Dr. Alan Turing'),
        (3, 'Database Internals', 'Transaction Isolation Levels & Concurrency Control', 'reference', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'DB_Concurrency_Reference.pdf', '3.5 MB', 'Prof. Margaret Hamilton'),
        (4, 'Machine Learning', 'Attention Is All You Need - Paper Breakdown & Math', 'pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Transformer_Math_Primer.pdf', '3.9 MB', 'Dr. Geoffrey Hinton');
    "#;
    db.execute_unprepared(materials_sql).await?;

    // 14. Announcements
    let announcements_sql = r#"
        INSERT INTO announcements (title, content, target_audience, department, author_name, is_pinned) VALUES
        ('Spring 2027 End-Semester Examination Schedule Published', 'The detailed timetable for end-semester examinations has been published on the portal. Students are advised to verify hall allocations and report any timetable conflicts to the Dean of Examinations before the end of the week.', 'all', 'All Departments', 'Office of the Dean of Examinations', true),
        ('Annual University Hackathon 2026 - Registration Open', 'Registrations are officially open for Hack-A-Verse 2026. Teams of up to 4 students from CSE, IT, and ECE are eligible to participate. Exciting innovation prizes and direct industry internship interviews sponsored by leading technology partners.', 'student', 'Computer Science & Engineering', 'CSE Student Council', true),
        ('Guest Lecture: Frontiers in Quantum Computing and AI', 'Join us on Friday at 3:30 PM in Auditorium A for an exclusive keynote lecture on Quantum Supremacy and Fault-Tolerant Architectures by visiting faculty from National Quantum Laboratories.', 'all', 'Computer Science & Engineering', 'Dr. Alan Turing', false),
        ('Campus Placement Drive: Round 2 Shortlisted Candidates', 'The list of students shortlisted for technical interviews in the Autumn placement drive is now available. Selected students should carry 3 copies of updated resume and university ID card to Hall 201.', 'student', 'Computer Science & Engineering', 'Training & Placement Cell', false);
    "#;
    db.execute_unprepared(announcements_sql).await?;

    // 15. Student Requests
    let requests_sql = r#"
        INSERT INTO student_requests (student_id, request_type, description, status, remarks) VALUES
        (1, 'Bonafide Certificate', 'Requesting an official Bonafide Certificate for National Scholarship portal verification.', 'Approved', 'Certificate signed and ready for pickup at Academic Office Counter 3.'),
        (1, 'Leave Request', 'Medical leave for 2 days due to seasonal fever and doctor-advised rest.', 'Approved', 'Medical certificate verified and attendance marked as excused.'),
        (1, 'Transcript Request', 'Official semester 1 to 5 academic transcripts for summer research internship application.', 'Under Review', 'Application under review by Registrar Office.');
    "#;
    db.execute_unprepared(requests_sql).await?;

    // 16. Notifications
    let notifications_sql = r#"
        INSERT INTO notifications (user_id, title, message, notification_type, link, is_read) VALUES
        (3, 'Assignment Deadline Approaching', 'Your Cloud Computing Dockerized Microservices assignment is due in 2 days. Ensure you submit your code repository and report.', 'assignment', '/assignments', false),
        (3, 'Examination Hall Ticket Released', 'Your Hall Ticket for End-Semester Examinations (Spring 2027) is available for download.', 'exam', '/examinations', false),
        (3, 'Request Status Updated', 'Your Bonafide Certificate request has been Approved and is ready for collection.', 'request', '/requests', false),
        (3, 'Attendance Alert', 'Your current overall attendance stands at 88.5%. Keep maintaining attendance above the 75% mandatory threshold.', 'attendance', '/attendance', true),
        (3, 'New Announcement Published', 'Annual University Hackathon 2026 registrations are now open. Form your team now!', 'announcement', '/announcements', true);
    "#;
    db.execute_unprepared(notifications_sql).await?;

    tracing::info!("Database seeding completed successfully!");
    Ok(())
}
