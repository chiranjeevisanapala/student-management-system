import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Users,
  CalendarCheck,
  FilePlus,
  Award,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  FileText,
  Send,
  X
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'students' | 'attendance' | 'assignments' | 'submissions'

  // Faculty Data State
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  // Attendance Form State
  const [attendanceForm, setAttendanceForm] = useState({
    student_id: 1,
    course_id: 1,
    subject_name: 'Database Management Systems',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    remarks: 'Active laboratory participation'
  });

  // Assignment Creation Form State
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    course_id: 1,
    subject_name: 'Database Management Systems',
    title: '',
    description: '',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    max_marks: 50
  });

  // Grading Modal State
  const [gradeModal, setGradeModal] = useState(null);
  const [gradeMarks, setGradeMarks] = useState(45);
  const [gradeFeedback, setGradeFeedback] = useState('Excellent schema normalization and indexing.');

  const fetchFacultyData = async () => {
    try {
      setLoading(true);
      const [coursesRes, studentsRes, subsRes] = await Promise.all([
        api.get('/api/faculty/courses'),
        api.get('/api/faculty/students'),
        api.get('/api/faculty/submissions')
      ]);

      setCourses(coursesRes.data);
      setStudents(studentsRes.data);
      setSubmissions(subsRes.data);

      if (coursesRes.data.length > 0) {
        setAttendanceForm((prev) => ({
          ...prev,
          course_id: coursesRes.data[0].id,
          subject_name: coursesRes.data[0].name
        }));
        setNewAssignment((prev) => ({
          ...prev,
          course_id: coursesRes.data[0].id,
          subject_name: coursesRes.data[0].name
        }));
      }
      if (studentsRes.data.length > 0) {
        setAttendanceForm((prev) => ({
          ...prev,
          student_id: studentsRes.data[0].id
        }));
      }
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to load faculty portal data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const handleRecordAttendance = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/faculty/attendance', {
        ...attendanceForm,
        student_id: Number(attendanceForm.student_id),
        course_id: Number(attendanceForm.course_id)
      });
      addToast('Attendance marked successfully into student record', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to record attendance', 'error');
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/faculty/assignments', {
        ...newAssignment,
        course_id: Number(newAssignment.course_id),
        max_marks: Number(newAssignment.max_marks)
      });
      addToast('New assignment published for student submissions', 'success');
      setAssignmentModal(false);
      fetchFacultyData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to publish assignment', 'error');
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (!gradeModal) return;

    try {
      await api.post('/api/faculty/grade', {
        submission_id: gradeModal.id,
        marks: Number(gradeMarks),
        feedback: gradeFeedback
      });
      addToast('Graded submission successfully with feedback', 'success');
      setGradeModal(null);
      fetchFacultyData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to submit grade', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/30">
              Faculty Console
            </span>
            <span className="text-xs text-blue-200">Department Academic Management</span>
          </div>
          <h1 className="text-2xl font-black mt-2">Welcome, {user?.name || 'Professor'}</h1>
          <p className="text-xs text-blue-200 mt-1">Manage lectures, record daily attendance, design course assignments, and evaluate submissions</p>
        </div>

        <button
          onClick={fetchFacultyData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition text-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'courses', label: 'Assigned Courses', count: courses.length },
          { id: 'students', label: 'Enrolled Students', count: students.length },
          { id: 'attendance', label: 'Record Attendance', count: null },
          { id: 'assignments', label: 'Create Assignment', count: null },
          { id: 'submissions', label: 'Submissions & Grading', count: submissions.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Courses */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-blue-400 transition">
              <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded">
                {c.code}
              </span>
              <h3 className="text-base font-bold text-gray-900 mt-2">{c.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{c.department} • Sem {c.semester}</p>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                <span>{c.credits} Credits</span>
                <span className="font-semibold text-blue-900">{c.enrolled_students} Students Enrolled</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Students */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-base font-bold text-gray-900">Enrolled Student Registry</h2>
            <p className="text-xs text-gray-500">Students assigned across your departmental courses</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Roll Number</th>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Program</th>
                  <th className="px-6 py-3">Semester</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3.5 font-mono text-xs font-bold text-gray-900">{s.roll_number}</td>
                    <td className="px-6 py-3.5 font-semibold text-gray-800">{s.name}</td>
                    <td className="px-6 py-3.5 text-xs text-gray-500">{s.email}</td>
                    <td className="px-6 py-3.5 text-xs text-gray-700">{s.course}</td>
                    <td className="px-6 py-3.5 text-xs text-gray-700">Sem {s.semester}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Attendance Entry Form */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-xl">
          <h2 className="text-base font-bold text-gray-900 mb-1">Record Session Attendance</h2>
          <p className="text-xs text-gray-500 mb-5">Records are instantly computed into student percentage summaries</p>

          <form onSubmit={handleRecordAttendance} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Student</label>
              <select
                value={attendanceForm.student_id}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, student_id: Number(e.target.value) })}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.roll_number} - {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Course / Subject</label>
              <select
                value={attendanceForm.course_id}
                onChange={(e) => {
                  const sel = courses.find((c) => c.id === Number(e.target.value));
                  setAttendanceForm({
                    ...attendanceForm,
                    course_id: Number(e.target.value),
                    subject_name: sel ? sel.name : attendanceForm.subject_name
                  });
                }}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={attendanceForm.date}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Attendance Status</label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Excused">Excused (Medical / Approved)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Remarks</label>
              <input
                type="text"
                value={attendanceForm.remarks}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, remarks: e.target.value })}
                placeholder="Optional notes or lecture topic"
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition"
            >
              <CalendarCheck className="w-4 h-4" />
              Save Attendance Record
            </button>
          </form>
        </div>
      )}

      {/* Tab: Create Assignment */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-xl">
          <h2 className="text-base font-bold text-gray-900 mb-1">Publish New Course Assignment</h2>
          <p className="text-xs text-gray-500 mb-5">Pushes notification to enrolled student dashboards</p>

          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Course</label>
              <select
                value={newAssignment.course_id}
                onChange={(e) => {
                  const sel = courses.find((c) => c.id === Number(e.target.value));
                  setNewAssignment({
                    ...newAssignment,
                    course_id: Number(e.target.value),
                    subject_name: sel ? sel.name : newAssignment.subject_name
                  });
                }}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Assignment Title *</label>
              <input
                type="text"
                required
                value={newAssignment.title}
                onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                placeholder="e.g. Distributed Database Sharding Lab"
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={newAssignment.due_date}
                  onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Maximum Marks *</label>
                <input
                  type="number"
                  required
                  min="10"
                  max="100"
                  value={newAssignment.max_marks}
                  onChange={(e) => setNewAssignment({ ...newAssignment, max_marks: Number(e.target.value) })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Instructions / Description</label>
              <textarea
                rows={4}
                value={newAssignment.description}
                onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                placeholder="Include questions, formatting requirements, and rubric details..."
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition"
            >
              <FilePlus className="w-4 h-4" />
              Publish Assignment
            </button>
          </form>
        </div>
      )}

      {/* Tab: Submissions & Grading */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-base font-bold text-gray-900">Student Submissions & Evaluation</h2>
            <p className="text-xs text-gray-500">Review student files, award marks, and provide constructive feedback</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Assignment</th>
                  <th className="px-6 py-3">Submission Details</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Marks</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {submissions.length > 0 ? (
                  submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-gray-900">{sub.student_name}</div>
                        <div className="text-[11px] font-mono text-gray-400">{sub.student_roll}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-medium text-gray-800">{sub.assignment_title}</div>
                        <div className="text-[11px] text-gray-500">{sub.subject_name}</div>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-gray-600 max-w-xs truncate">
                        {sub.submission_text || sub.file_name || 'Attached file'}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          sub.status === 'Graded' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-gray-900">
                        {sub.marks !== null ? `${sub.marks} pts` : <span className="text-gray-400 font-normal">Pending</span>}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setGradeModal(sub);
                            setGradeMarks(sub.marks || 45);
                            setGradeFeedback(sub.feedback || 'Good work on this submission.');
                          }}
                          className="px-3 py-1 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                          {sub.status === 'Graded' ? 'Update Grade' : 'Grade Submission'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">
                      No student submissions received yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {gradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setGradeModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Evaluate Submission</h3>
            <p className="text-xs text-gray-500 mb-4">{gradeModal.assignment_title} - {gradeModal.student_name}</p>

            {gradeModal.submission_text && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700 mb-4 max-h-32 overflow-y-auto">
                <span className="font-semibold text-gray-900 block mb-1">Student Answer:</span>
                {gradeModal.submission_text}
              </div>
            )}

            <form onSubmit={handleGradeSubmission} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Marks Awarded</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={gradeMarks}
                  onChange={(e) => setGradeMarks(Number(e.target.value))}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Faculty Feedback</label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Constructive feedback for the student..."
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setGradeModal(null)} className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-900 rounded-lg">Publish Grade</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
