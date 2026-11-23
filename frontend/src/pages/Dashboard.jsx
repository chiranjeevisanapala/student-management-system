import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import {
  BookOpen,
  CalendarCheck,
  FileText,
  GraduationCap,
  Award,
  Clock,
  ChevronRight,
  Megaphone,
  Bell,
  ArrowUpRight,
  Loader2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading student academic metrics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Attendance bar chart sample distribution
  const attendanceChartData = [
    { subject: 'Algorithms', percentage: 87.5 },
    { subject: 'Cloud Sys', percentage: 85.7 },
    { subject: 'DB Internals', percentage: 100.0 },
    { subject: 'ML Found', percentage: 80.0 },
    { subject: 'Cybersec', percentage: 100.0 },
  ];

  return (
    <Layout title="Dashboard">
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Welcome Banner Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 text-white p-8 shadow-xl shadow-brand-950/10">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-brand-200 text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Academic Year 2026-2027</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome back, {data?.welcome_name || 'Student'}!
            </h1>
            <p className="text-brand-200 text-sm mt-2 leading-relaxed">
              Enrolled in <span className="font-semibold text-white">{data?.department}</span> •
              Semester <span className="font-semibold text-white">{data?.semester}</span> • Student ID:{' '}
              <span className="font-mono font-semibold text-white">{data?.student_id}</span>
            </p>
          </div>

          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10 pointer-events-none">
            <GraduationCap className="w-80 h-80 text-white" />
          </div>
        </div>

        {/* Dynamic Statistic Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Enrolled Courses */}
          <div
            onClick={() => navigate('/courses')}
            className="cursor-pointer bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-brand-300 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Enrolled Courses
              </span>
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {data?.total_enrolled_courses || 0}
              </span>
              <span className="text-xs font-medium text-slate-500">Subjects Active</span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-600">
              <span>View curriculum</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Attendance */}
          <div
            onClick={() => navigate('/attendance')}
            className="cursor-pointer bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Overall Attendance
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {data?.attendance_percentage || 0}%
              </span>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                Above 75% Target
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
              <span>Attendance breakdown</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Pending Assignments */}
          <div
            onClick={() => navigate('/assignments')}
            className="cursor-pointer bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-300 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pending Assignments
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {data?.pending_assignments || 0}
              </span>
              <span className="text-xs font-medium text-amber-600 font-semibold">
                Tasks due this week
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-600">
              <span>Open submissions</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Academic Performance / CGPA */}
          <div
            onClick={() => navigate('/results')}
            className="cursor-pointer bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-purple-300 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Cumulative CGPA
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {data?.cgpa?.toFixed(2) || '8.75'}
              </span>
              <span className="text-xs font-medium text-purple-600 font-semibold">
                SGPA {data?.sgpa?.toFixed(2) || '8.80'}
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-600">
              <span>View grade transcript</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Middle Section: Chart & Upcoming Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Attendance Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Subject Attendance Overview</h3>
                <p className="text-xs text-slate-500">Live attendance percentage per enrolled course</p>
              </div>
              <button
                onClick={() => navigate('/attendance')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center space-x-1"
              >
                <span>Full History</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceChartData}>
                  <XAxis dataKey="subject" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`${val}%`, 'Attendance']}
                  />
                  <Bar dataKey="percentage" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upcoming Assignment Deadlines */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Upcoming Deadlines</h3>
              <span className="text-xs font-bold px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full">
                Action Required
              </span>
            </div>
            <div className="flex-1 space-y-3.5 mt-2 overflow-y-auto">
              {data?.upcoming_deadlines?.length > 0 ? (
                data.upcoming_deadlines.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate('/assignments')}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-brand-50/60 border border-slate-200/60 hover:border-brand-200 transition-all cursor-pointer"
                  >
                    <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
                      {item.subject_name}
                    </p>
                    <p className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">
                      {item.title}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Due {item.due_date}</span>
                      </span>
                      <span className="font-semibold text-slate-700">{item.max_marks} Marks</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-slate-400">
                  No upcoming deadlines pending!
                </div>
              )}
            </div>
            <button
              onClick={() => navigate('/assignments')}
              className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
            >
              View All Assignments
            </button>
          </div>
        </div>

        {/* Bottom Section: Announcements & Today's Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Announcements */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                  <Megaphone className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Campus Notices</h3>
              </div>
              <button
                onClick={() => navigate('/announcements')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center space-x-1"
              >
                <span>All Notices</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {data?.recent_announcements?.slice(0, 3).map((notice) => (
                <div
                  key={notice.id}
                  onClick={() => navigate('/announcements')}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                      {notice.author_name}
                    </span>
                    {notice.is_pinned && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Important
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-2 line-clamp-1">{notice.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notice.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Timetable Preview */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Weekly Lecture Schedule</h3>
              </div>
              <button
                onClick={() => navigate('/timetable')}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 inline-flex items-center space-x-1"
              >
                <span>Full Timetable</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {data?.weekly_schedule?.slice(0, 4).map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-16 text-center font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1.5 rounded-xl border border-brand-200/40">
                      {slot.start_time.split(' ')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{slot.subject_name}</p>
                      <p className="text-xs text-slate-500">
                        {slot.classroom} • {slot.faculty_name}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200/70 text-slate-700">
                    {slot.day_of_week}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
