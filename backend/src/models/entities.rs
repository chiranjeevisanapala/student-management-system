use chrono::{DateTime, NaiveDate, Utc};
use sea_orm::FromQueryResult;
use serde::{Deserialize, Serialize};

#[derive(Debug, FromQueryResult, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: i32,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: String,
    pub name: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, FromQueryResult, Serialize, Deserialize, Clone)]
pub struct Student {
    pub id: i32,
    pub user_id: i32,
    pub roll_number: String,
    pub phone: Option<String>,
    pub department: String,
    pub course: String,
    pub academic_year: String,
    pub semester: i32,
    pub join_date: NaiveDate,
    pub avatar_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, FromQueryResult, Serialize, Deserialize, Clone)]
pub struct StudentProfileView {
    pub id: i32,
    pub user_id: i32,
    pub name: String,
    pub email: String,
    pub roll_number: String,
    pub phone: Option<String>,
    pub department: String,
    pub course: String,
    pub academic_year: String,
    pub semester: i32,
    pub join_date: NaiveDate,
    pub avatar_url: Option<String>,
}

#[derive(Debug, FromQueryResult, Serialize, Deserialize, Clone)]
pub struct Faculty {
    pub id: i32,
    pub user_id: i32,
    pub employee_id: String,
    pub phone: Option<String>,
    pub department: String,
    pub designation: String,
    pub qualification: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, FromQueryResult, Serialize, Deserialize, Clone)]
pub struct Department {
    pub id: i32,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, FromQueryResult, Serialize, Deserialize, Clone)]
pub struct Course {
    pub id: i32,
    pub code: String,
    pub name: String,
    pub department: String,
    pub credits: i32,
    pub semester: i32,
    pub description: Option<String>,
    pub faculty_name: String,
}

#[derive(Debug, FromQueryResult, Serialize, Deserialize, Clone)]
pub struct EnrolledCourseView {
    pub id: i32,
    pub code: String,
    pub name: String,
    pub department: String,
    pub credits: i32,
    pub semester: i32,
    pub description: Option<String>,
    pub faculty_name: String,
    pub progress: i32,
    pub status: String,
    pub attended_classes: Option<i64>,
    pub total_classes: Option<i64>,
    pub attendance_percentage: Option<f64>,
}

#[derive(Debug, FromQueryResult, Serialize, Deserialize, Clone)]
pub struct Assignment {
    pub id: i32,
    pub course_id: Option<i32>,
    pub subject_name: String,
    pub title: String,
    pub description: Option<String>,
    pub faculty_name: String,
    pub assigned_date: NaiveDate,
    pub due_date: NaiveDate,
    pub max_marks: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, FromQueryResult, Serialize, Deserialize, Clone)]
pub struct AssignmentWithSubmissionView {
    pub id: i32,
    pub course_id: Option<i32>,
    pub subject_name: String,
    pub title: String,
    pub description: Option<String>,
    pub faculty_name: String,
    pub assigned_date: NaiveDate,
    pub due_date: NaiveDate,
    pub max_marks: i32,
    pub submission_id: Option<i32>,
    pub submission_text: Option<String>,
    pub file_url: Option<String>,
    pub file_name: Option<String>,
    pub submitted_at: Option<DateTime<Utc>>,
    pub marks: Option<i32>,
    pub feedback: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, FromQueryResult, Serialize, Deserialize, Clone)]
pub struct AttendanceRecord {
    pub id: i32,
    pub student_id: i32,
    pub course_id: Option<i32>,
    pub subject_name: String,
    pub date: NaiveDate,
    pub status: String,
    pub remarks: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AttendanceSubjectSummary {
    pub subject_name: String,
    pub total_classes: i64,
    pub attended_classes: i64,
    pub absent_classes: i64,
    pub percentage: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AttendanceOverallSummary {
    pub total_classes: i64,
    pub attended_classes: i64,
    pub absent_classes: i64,
    pub overall_percentage: f64,
    pub subject_breakdown: Vec<AttendanceSubjectSummary>,
    pub monthly_stats: Vec<MonthlyAttendance>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MonthlyAttendance {
    pub month: String,
    pub attended: i64,
    pub total: i64,
    pub percentage: f64,
}

#[derive(Debug, FromQueryResult, Serialize, Deserialize, Clone)]
pub struct TimetableSlot {
    pub id: i32,
    pub course_id: Option<i32>,
    pub day_of_week: String,
    pub subject_name: String,
    pub faculty_name: String,
    pub classroom: String,
    pub start_time: String,
    pub end_time: String,
}

#[derive(Debug, FromQueryResult, Serialize, Deserialize, Clone)]
pub struct ExaminationItem {
    pub id: i32,
    pub course_id: Option<i32>,
    pub subject_name: String,
    pub exam_name: String,
    pub exam_type: String,
    pub exam_date: NaiveDate,
    pub start_time: String,
    pub end_time: String,
    pub exam_hall: String,
    pub instructions: Option<String>,
    pub is_completed: bool,
}

#[derive(Debug, FromQueryResult, Serialize, Deserialize, Clone)]
pub struct ResultRecord {
    pub id: i32,
    pub student_id: i32,
    pub course_id: Option<i32>,
    pub subject_name: String,
    pub semester: i32,
    pub internal_marks: f64,
    pub external_marks: f64,
    pub total_marks: f64,
    pub grade: String,
    pub pass_status: String,
    pub sgpa: f64,
    pub cgpa: f64,
}

#[derive(Debug, FromQueryResult, Serialize, Deserialize, Clone)]
pub struct StudyMaterialItem {
    pub id: i32,
    pub course_id: Option<i32>,
    pub subject_name: String,
    pub title: String,
    pub material_type: String,
    pub file_url: String,
    pub file_name: String,
    pub file_size: String,
    pub uploaded_by: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, FromQueryResult, Serialize, Deserialize, Clone)]
pub struct AnnouncementItem {
    pub id: i32,
    pub title: String,
    pub content: String,
    pub target_audience: String,
    pub department: Option<String>,
    pub author_name: String,
    pub is_pinned: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, FromQueryResult, Serialize, Deserialize, Clone)]
pub struct StudentRequestItem {
    pub id: i32,
    pub student_id: i32,
    pub request_type: String,
    pub description: String,
    pub status: String,
    pub remarks: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, FromQueryResult, Serialize, Deserialize, Clone)]
pub struct NotificationItem {
    pub id: i32,
    pub user_id: i32,
    pub title: String,
    pub message: String,
    pub notification_type: String,
    pub link: Option<String>,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
}

// Request and Response DTOs
#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub name: String,
    pub roll_number: String,
    pub email: String,
    pub phone: Option<String>,
    pub password: String,
    pub department: String,
    pub course: String,
    pub academic_year: String,
    pub semester: i32,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
    pub remember_me: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserView,
}

#[derive(Debug, Serialize)]
pub struct UserView {
    pub id: i32,
    pub email: String,
    pub name: String,
    pub role: String,
    pub student_id: Option<i32>,
    pub roll_number: Option<String>,
    pub department: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ForgotPasswordRequest {
    pub email: String,
}

#[derive(Debug, Deserialize)]
pub struct ResetPasswordRequest {
    pub token: String,
    pub new_password: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfileRequest {
    pub phone: Option<String>,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

#[derive(Debug, Deserialize)]
pub struct SubmitAssignmentRequest {
    pub submission_text: Option<String>,
    pub file_name: Option<String>,
    pub file_data_base64: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateStudentRequest {
    pub request_type: String,
    pub description: String,
}

#[derive(Debug, Serialize)]
pub struct DashboardStats {
    pub welcome_name: String,
    pub student_id: String,
    pub department: String,
    pub semester: i32,
    pub total_enrolled_courses: i64,
    pub attendance_percentage: f64,
    pub pending_assignments: i64,
    pub upcoming_examinations: i64,
    pub cgpa: f64,
    pub sgpa: f64,
    pub recent_announcements: Vec<AnnouncementItem>,
    pub recent_notifications: Vec<NotificationItem>,
    pub upcoming_deadlines: Vec<Assignment>,
    pub weekly_schedule: Vec<TimetableSlot>,
}
