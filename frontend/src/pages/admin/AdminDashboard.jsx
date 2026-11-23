import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  FileCheck,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Bell,
  RefreshCw,
  Search,
  Filter,
  Send,
  X
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'students' | 'courses' | 'faculty' | 'requests' | 'announcements'

  // Admin Data State
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [allRequests, setAllRequests] = useState([]);

  // Modals & Form State
  const [courseModal, setCourseModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    department: 'Computer Science',
    credits: 4,
    semester: 5,
    description: '',
    faculty_name: 'Dr. Sarah Jenkins'
  });

  const [facultyModal, setFacultyModal] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    email: '',
    password: 'Password@123',
    employee_id: '',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    qualification: 'Ph.D. in Computer Science'
  });

  const [announcementModal, setAnnouncementModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    target_audience: 'All Students',
    department: 'Computer Science',
    is_pinned: false
  });

  const [requestActionModal, setRequestActionModal] = useState(null);
  const [actionStatus, setActionStatus] = useState('Approved');
  const [actionRemarks, setActionRemarks] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, studentsRes, coursesRes, facultyRes, requestsRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/students'),
        api.get('/api/admin/courses'),
        api.get('/api/admin/faculty'),
        api.get('/api/admin/requests')
      ]);

      setStats(statsRes.data);
      setStudents(studentsRes.data);
      setCourses(coursesRes.data);
      setFacultyList(facultyRes.data);
      setAllRequests(requestsRes.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to load administrative console data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/courses', {
        ...newCourse,
        credits: Number(newCourse.credits),
        semester: Number(newCourse.semester)
      });
      addToast('Course created and curriculum updated', 'success');
      setCourseModal(false);
      fetchAdminData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create course', 'error');
    }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/faculty', newFaculty);
      addToast('Faculty member onboarded successfully', 'success');
      setFacultyModal(false);
      fetchAdminData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create faculty member', 'error');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/announcements', newAnnouncement);
      addToast('Announcement published across the institution', 'success');
      setAnnouncementModal(false);
      fetchAdminData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to publish announcement', 'error');
    }
  };

  const handleUpdateRequestStatus = async (e) => {
    e.preventDefault();
    if (!requestActionModal) return;

    try {
      await api.patch(`/api/admin/requests/${requestActionModal.id}`, {
        status: actionStatus,
        remarks: actionRemarks.trim() || undefined
      });
      addToast(`Request #${requestActionModal.id} marked as ${actionStatus}`, 'success');
      setRequestActionModal(null);
      fetchAdminData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update request', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Admin Console
            </span>
            <span className="text-xs text-gray-400">Institutional Governance & System Management</span>
          </div>
          <h1 className="text-2xl font-black mt-2">Welcome, {user?.name || 'Administrator'}</h1>
          <p className="text-xs text-blue-200 mt-1">Full privileged access to student records, faculty rosters, and curriculum schedules</p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition text-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500">Enrolled Students</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-gray-900">
            {stats?.total_students ?? 0}
          </div>
          <p className="text-xs text-gray-500 mt-1">Active student database</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500">Faculty Members</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-gray-900">
            {stats?.total_faculty ?? 0}
          </div>
          <p className="text-xs text-gray-500 mt-1">Professors & teaching staff</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500">Academic Courses</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-gray-900">
            {stats?.total_courses ?? 0}
          </div>
          <p className="text-xs text-gray-500 mt-1">Active syllabus offerings</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500">Pending Requests</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <FileCheck className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-amber-600">
            {stats?.pending_requests ?? 0}
          </div>
          <p className="text-xs text-gray-500 mt-1">Awaiting administrative decision</p>
        </div>
      </div>

      {/* Admin Action Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'students', label: 'Student Directory', count: students.length },
          { id: 'courses', label: 'Courses & Curriculum', count: courses.length },
          { id: 'faculty', label: 'Faculty Management', count: facultyList.length },
          { id: 'requests', label: 'Student Applications', count: allRequests.length },
          { id: 'announcements', label: 'Publish Circular', count: null }
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

      {/* Tab: Students */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Enrolled Students Roster</h2>
              <p className="text-xs text-gray-500">Official student registry verified in PostgreSQL</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Roll No.</th>
                  <th className="px-6 py-3">Full Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Semester</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3.5 font-mono text-xs font-bold text-gray-900">{s.roll_number}</td>
                    <td className="px-6 py-3.5 font-semibold text-gray-800">{s.name}</td>
                    <td className="px-6 py-3.5 text-xs text-gray-500">{s.email}</td>
                    <td className="px-6 py-3.5 text-xs text-gray-700">{s.department}</td>
                    <td className="px-6 py-3.5 text-xs text-gray-700">Sem {s.semester}</td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Courses */}
      {activeTab === 'courses' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Curriculum & Subjects</h2>
              <p className="text-xs text-gray-500">Institutional credit distribution and faculty assignments</p>
            </div>
            <button
              onClick={() => setCourseModal(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition"
            >
              <PlusCircle className="w-4 h-4" />
              Add New Course
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Course Title</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Credits</th>
                  <th className="px-6 py-3">Semester</th>
                  <th className="px-6 py-3">Assigned Faculty</th>
                  <th className="px-6 py-3">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3.5 font-mono text-xs font-bold text-blue-900">{c.code}</td>
                    <td className="px-6 py-3.5 font-semibold text-gray-800">{c.name}</td>
                    <td className="px-6 py-3.5 text-xs text-gray-600">{c.department}</td>
                    <td className="px-6 py-3.5 text-xs text-gray-600">{c.credits} Credits</td>
                    <td className="px-6 py-3.5 text-xs text-gray-600">Sem {c.semester}</td>
                    <td className="px-6 py-3.5 text-xs font-medium text-gray-800">{c.faculty_name}</td>
                    <td className="px-6 py-3.5 text-xs font-bold text-gray-900">{c.enrolled_count} students</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Faculty */}
      {activeTab === 'faculty' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Faculty Roster</h2>
              <p className="text-xs text-gray-500">Academic professors, designations, and departments</p>
            </div>
            <button
              onClick={() => setFacultyModal(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition"
            >
              <PlusCircle className="w-4 h-4" />
              Onboard Faculty Member
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Employee ID</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Designation</th>
                  <th className="px-6 py-3">Qualification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {facultyList.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3.5 font-mono text-xs font-bold text-gray-900">{f.employee_id}</td>
                    <td className="px-6 py-3.5 font-semibold text-gray-800">{f.name}</td>
                    <td className="px-6 py-3.5 text-xs text-gray-500">{f.email}</td>
                    <td className="px-6 py-3.5 text-xs text-gray-700">{f.department}</td>
                    <td className="px-6 py-3.5 text-xs font-medium text-gray-800">{f.designation}</td>
                    <td className="px-6 py-3.5 text-xs text-gray-500">{f.qualification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Requests */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-base font-bold text-gray-900">Student Applications for Review</h2>
            <p className="text-xs text-gray-500">Approve, reject, or comment on official academic applications</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Req ID</th>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Justification</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3.5 font-mono text-xs font-bold text-gray-900">
                      REQ-#{req.id.toString().padStart(4, '0')}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-gray-900">{req.student_name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{req.roll_number}</div>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-gray-800">{req.request_type}</td>
                    <td className="px-6 py-3.5 text-xs text-gray-600 max-w-xs truncate">{req.description}</td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                        req.status === 'Under Review' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setRequestActionModal(req);
                          setActionStatus(req.status === 'Pending' ? 'Approved' : req.status);
                          setActionRemarks(req.remarks || '');
                        }}
                        className="px-3 py-1 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                      >
                        Decide / Remark
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Announcements */}
      {activeTab === 'announcements' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
          <h2 className="text-base font-bold text-gray-900 mb-1">Broadcast Campus Circular</h2>
          <p className="text-xs text-gray-500 mb-5">Publishes immediate official bulletin visible to all student portals</p>

          <form onSubmit={handleCreateAnnouncement} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Title of Circular *</label>
              <input
                type="text"
                required
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                placeholder="e.g. End-Semester Examination Registration Notification"
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Audience</label>
                <select
                  value={newAnnouncement.target_audience}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, target_audience: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All Students">All Students</option>
                  <option value="Final Year Students">Final Year Students</option>
                  <option value="Faculty & Staff">Faculty & Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={newAnnouncement.department}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, department: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Content / Body *</label>
              <textarea
                rows={5}
                required
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                placeholder="Enter circular guidelines and instructions..."
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pin_circular"
                checked={newAnnouncement.is_pinned}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, is_pinned: e.target.checked })}
                className="rounded text-blue-900 focus:ring-blue-500"
              />
              <label htmlFor="pin_circular" className="text-xs font-semibold text-gray-700">
                Pin this circular to top of student announcements
              </label>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition"
            >
              <Send className="w-3.5 h-3.5" />
              Publish Announcement
            </button>
          </form>
        </div>
      )}

      {/* Course Modal */}
      {courseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setCourseModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Course</h3>
            <form onSubmit={handleCreateCourse} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Course Code</label>
                <input
                  type="text"
                  required
                  placeholder="CS401"
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Course Name</label>
                <input
                  type="text"
                  required
                  placeholder="Distributed Cloud Architectures"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={newCourse.credits}
                    onChange={(e) => setNewCourse({ ...newCourse, credits: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={newCourse.semester}
                    onChange={(e) => setNewCourse({ ...newCourse, semester: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Faculty Name</label>
                <input
                  type="text"
                  required
                  value={newCourse.faculty_name}
                  onChange={(e) => setNewCourse({ ...newCourse, faculty_name: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setCourseModal(false)} className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-900 rounded-lg">Save Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Faculty Modal */}
      {facultyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setFacultyModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Onboard Faculty Member</h3>
            <form onSubmit={handleCreateFaculty} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Prof. Alan Turing"
                  value={newFaculty.name}
                  onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  placeholder="turing@university.edu"
                  value={newFaculty.email}
                  onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    placeholder="FAC-1004"
                    value={newFaculty.employee_id}
                    onChange={(e) => setNewFaculty({ ...newFaculty, employee_id: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={newFaculty.designation}
                    onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  value={newFaculty.password}
                  onChange={(e) => setNewFaculty({ ...newFaculty, password: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setFacultyModal(false)} className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-900 rounded-lg">Onboard Faculty</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Request Modal */}
      {requestActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setRequestActionModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Decide Request Status</h3>
            <p className="text-xs text-gray-500 mb-4">{requestActionModal.request_type} - {requestActionModal.student_name}</p>

            <form onSubmit={handleUpdateRequestStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status Decision</label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Approved">Approved</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Administrative Remarks / Instructions</label>
                <textarea
                  rows={3}
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  placeholder="e.g. Approved. Certificate ready for collection at Registrar Desk 3."
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setRequestActionModal(null)} className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-900 rounded-lg">Apply Decision</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
