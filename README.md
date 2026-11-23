# Modern Student Academic Portal – Full-Stack Student Management System

A high-performance, production-ready, full-stack Student Management System built using **Rust with Loco.rs**, **PostgreSQL**, **React.js with Vite**, and **Tailwind CSS**.

---

## 🏛️ System Architecture

- **Backend:** [Rust](https://www.rust-lang.org/) with [Loco.rs](https://loco.rs/) v1.3.1 (powered by Tokio async runtime, Axum 0.8 HTTP engine, SeaORM 2.0 active-record query engine, and Argon2 password hashing).
- **Frontend:** [React.js](https://react.dev/) 18 with [Vite](https://vitejs.dev/) 6, [Tailwind CSS](https://tailwindcss.com/), [React Router](https://reactrouter.com/) v6, [Axios](https://axios-http.com/), [Lucide React](https://lucide.dev/), and [Recharts](https://recharts.org/).
- **Database:** [PostgreSQL](https://www.postgresql.org/) relational database with 19 structured tables and versioned schema migrations.
- **Authentication & Security:** JWT (JSON Web Tokens) with Argon2id password hashing, HTTP Bearer authentication, and role-based access control (Student, Faculty, Administrator).
- **Containerization:** Multi-stage Docker builds and `docker-compose.yml` for unified local development and production hosting.

---

## 🚀 Key Features

### 1. Application Entry Flow & Security
- Public Authentication: Login, Student Registration, Forgot Password, and Reset Password token workflows.
- Protected Routes: Unauthenticated users are redirected to `/login`; authenticated users are routed to their role-specific dashboards (`/dashboard`, `/faculty`, or `/admin`).
- Persistent Sessions: LocalStorage JWT persistence with auto-attach Axios bearer interceptors and 401 expiration handling.

### 2. Comprehensive Student Portal (14 Dedicated Views)
1. **Dashboard (`/dashboard`)**: Welcome banner, dynamic GPA metrics, attendance percentage, pending assignments, upcoming exams, real-time timetable preview, and announcements.
2. **My Profile (`/profile`)**: Institutional credentials, semester, roll number, department, with editable contact information and avatar.
3. **My Courses (`/courses`)**: Enrolled course syllabus, credits, assigned professors, course progress bars, and modal details.
4. **Assignments (`/assignments`)**: Filter by status (Pending, Submitted, Graded), max marks, due dates, and document submission with file upload (base64).
5. **Attendance (`/attendance`)**: Formula calculation `(Attended / Total) × 100`, debarment risk warning below 75%, monthly Recharts trend graph, and full log table.
6. **Timetable (`/timetable`)**: Daily interactive tabs and Weekly grid view for Monday through Saturday with rooms and faculty.
7. **Examinations (`/examinations`)**: Scheduled vs. completed examinations, exam halls, timing, and downloadable instructions.
8. **Results (`/results`)**: SGPA/CGPA cards, internal marks (40), external marks (60), total marks (100), and letter grade badges.
9. **Study Materials (`/materials`)**: Searchable repository of lecture notes, PDF guides, and presentations with download capabilities.
10. **Announcements (`/announcements`)**: University-wide and department circulars with pinned notice prominence and full detail modals.
11. **My Requests (`/requests`)**: Bonafide certificates, leave requests, transcripts, and fee certificates with timeline tracking and status updates.
12. **Notifications (`/notifications`)**: Real-time assignment reminders, exam notifications, attendance warnings, and "mark all as read".
13. **Settings (`/settings`)**: Secure password change requiring current password verification, notification preferences, and logout.
14. **Logout**: Session termination with token purging and clean state reset.

### 3. Faculty Console (`/faculty`)
- View assigned curriculum courses and enrolled student rosters.
- Record session attendance into PostgreSQL.
- Publish assignments with due dates and rubric marks.
- Review student submissions, assign marks, and issue constructive faculty feedback.

### 4. Administrator Console (`/admin`)
- System KPI metrics: Total Students, Total Faculty, Total Courses, Pending Requests.
- Student & Faculty roster management.
- Course creation and curriculum credit allocation.
- Review and update student requests (Approve, Reject, Under Review) with official administrative remarks.
- Broadcast campus-wide circulars and announcements.

---

## 🔑 Demo Login Credentials

Pre-seeded credentials ready for instant evaluation:

| Role | Email | Password | Access Route |
| :--- | :--- | :--- | :--- |
| **Student** | `student@university.edu` | `Password@123` | `/dashboard` |
| **Faculty** | `faculty@university.edu` | `Password@123` | `/faculty` |
| **Administrator** | `admin@university.edu` | `Password@123` | `/admin` |

---

## 🛠️ Local Development Setup

### Prerequisites
- [Rust](https://rustup.rs/) (1.78+ or 1.80+)
- [Node.js](https://nodejs.org/) (v18+ or v20+)
- [PostgreSQL](https://www.postgresql.org/) (v15+)

### 1. Database Setup
Ensure PostgreSQL is running locally on port 5432:
```bash
# Create database
psql -U postgres -c "CREATE DATABASE student_management_db;"
```

### 2. Backend Setup (Rust + Loco.rs)
```bash
cd backend

# Run database migrations
cargo run -- db migrate

# Seed demo data
cargo run -- db seed

# Run automated test suite
cargo test --test api_tests

# Start the Loco server (runs on http://localhost:5150)
cargo run -- start
```

### 3. Frontend Setup (React + Vite)
```bash
cd frontend

# Install dependencies
npm install

# Build static assets (verifies zero compile errors)
npm run build

# Start the development server (runs on http://localhost:5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🐳 Docker Production Deployment

Run the complete multi-tier system with a single command:

```bash
# Build and start PostgreSQL, Loco Backend, and Nginx Frontend
docker-compose up --build -d
```

- **Frontend Portal:** `http://localhost` (Port 80)
- **Loco Backend API:** `http://localhost:5150` (Port 5150)
- **PostgreSQL Database:** `localhost:5432`

---

## 📡 REST API Reference

| Endpoint | Method | Role | Description |
| :--- | :---: | :---: | :--- |
| `/api/auth/register` | `POST` | Public | Register new student profile |
| `/api/auth/login` | `POST` | Public | Authenticate and issue JWT |
| `/api/auth/logout` | `POST` | Public | Invalidate current session |
| `/api/auth/forgot-password` | `POST` | Public | Generate reset token |
| `/api/auth/reset-password` | `POST` | Public | Apply new password using token |
| `/api/auth/me` | `GET` | User | Get authenticated session claims |
| `/api/dashboard` | `GET` | Student | Aggregate student statistics and schedule |
| `/api/profile` | `GET` / `PUT` | Student | View / update personal information |
| `/api/courses` | `GET` | Student | List enrolled courses |
| `/api/assignments` | `GET` | Student | List assignments with submission status |
| `/api/assignments/:id/submit`| `POST` | Student | Submit assignment file/notes |
| `/api/attendance` | `GET` | Student | Fetch chronological attendance logs |
| `/api/attendance/summary` | `GET` | Student | Get formula-calculated attendance statistics |
| `/api/timetable` | `GET` | Student | Weekly timetable slots |
| `/api/examinations` | `GET` | Student | Upcoming & completed exams |
| `/api/results` | `GET` | Student | Semester marks and SGPA/CGPA cards |
| `/api/materials` | `GET` | Student | Search and filter study notes/PDFs |
| `/api/announcements` | `GET` | Student | Official notices and circulars |
| `/api/requests` | `GET` / `POST`| Student | List / submit academic certificate requests |
| `/api/requests/:id` | `GET` | Student | Request audit trail and history |
| `/api/notifications` | `GET` | Student | Database-backed alerts |
| `/api/notifications/:id/read`| `PATCH`| Student | Mark alert as read |
| `/api/settings/password` | `PUT` | User | Change password with verification |
| `/api/admin/stats` | `GET` | Admin | Administrative KPI counts |
| `/api/admin/students` | `GET` | Admin | Full student registry |
| `/api/admin/courses` | `GET` / `POST`| Admin | List / create academic courses |
| `/api/admin/faculty` | `GET` / `POST`| Admin | List / onboard faculty members |
| `/api/admin/requests` | `GET` | Admin | Review student applications |
| `/api/admin/requests/:id` | `PATCH`| Admin | Approve / reject student request |
| `/api/admin/announcements` | `POST` | Admin | Broadcast campus-wide circular |
| `/api/faculty/courses` | `GET` | Faculty | Assigned courses |
| `/api/faculty/students` | `GET` | Faculty | Assigned student roster |
| `/api/faculty/attendance` | `POST` | Faculty | Record lecture attendance |
| `/api/faculty/assignments` | `POST` | Faculty | Publish assignment |
| `/api/faculty/submissions` | `GET` | Faculty | Review student submissions |
| `/api/faculty/grade` | `POST` | Faculty | Grade submission with feedback |

---

## 🔒 Security & Verification Highlights

1. **Strict Backend Authorization:** Role extractors (`AuthUser`, `FacultyUser`, `AdminUser`) enforce permissions at the route handler level; student requests cannot access administrative routes regardless of client manipulation.
2. **Zero Tampering of Institutional Attributes:** Students can update phone numbers and avatars, but student IDs, roll numbers, and academic roles cannot be modified.
3. **Argon2 Password Hashing:** Salted Argon2id hashing prevents brute-force and credential stuffing.
4. **Data Isolation:** Students can only read their own academic results, grades, and personal applications.

---

## 📄 License
This project is licensed under the MIT License.
