import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  BarChart2,
  BookOpen,
  ArrowUpRight,
  RefreshCw,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Attendance() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const [summaryRes, recordsRes] = await Promise.all([
        api.get('/api/attendance/summary'),
        api.get('/api/attendance')
      ]);
      setSummary(summaryRes.data);
      setRecords(recordsRes.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to load attendance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const overallPct = summary?.overall_percentage ?? 0;
  const isAttendanceShortage = overallPct < 75.0;

  const filteredRecords = records.filter(rec => {
    const matchesSubject = selectedSubject === 'all' || rec.subject_name === selectedSubject;
    const matchesStatus = selectedStatus === 'all' || rec.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSubject && matchesStatus;
  });

  const uniqueSubjects = Array.from(new Set(records.map(r => r.subject_name)));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Monitoring</h1>
          <p className="text-sm text-gray-600 mt-1">
            Real-time tracking computed via Formula: (Classes Attended / Total Classes) × 100
          </p>
        </div>
        <button
          onClick={fetchAttendanceData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Attendance Shortage Alert */}
      {isAttendanceShortage && !loading && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <span className="font-semibold">Academic Attendance Warning:</span> Your aggregate attendance is currently{' '}
            <span className="font-bold">{overallPct}%</span>, which is below the mandatory minimum threshold of 75.0%. Please attend upcoming lectures to avoid exam debarment.
          </div>
        </div>
      )}

      {/* KPI Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Overall Attendance</span>
            <span className={`p-2 rounded-lg ${
              overallPct >= 75 ? 'bg-emerald-50 text-emerald-600' :
              overallPct >= 65 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <CalendarCheck className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{overallPct}%</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              overallPct >= 75 ? 'bg-emerald-100 text-emerald-800' :
              overallPct >= 65 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {overallPct >= 75 ? 'Eligible' : overallPct >= 65 ? 'Caution' : 'Debarment Risk'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                overallPct >= 75 ? 'bg-emerald-600' : overallPct >= 65 ? 'bg-amber-500' : 'bg-rose-600'
              }`}
              style={{ width: `${Math.min(overallPct, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Classes Attended</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{summary?.attended_classes ?? 0}</span>
            <span className="text-xs text-gray-500">sessions</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Present & excused academic leaves</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Absences Recorded</span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <XCircle className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{summary?.absent_classes ?? 0}</span>
            <span className="text-xs text-gray-500">sessions missed</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Total unexcused missed lectures</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Held Classes</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{summary?.total_classes ?? 0}</span>
            <span className="text-xs text-gray-500">curriculum hours</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Current academic semester</p>
        </div>
      </div>

      {/* Monthly Attendance Chart & Subject Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Recharts Bar Graph */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600" />
                Monthly Attendance Progression
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Aggregated percentage performance across semester terms</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {summary?.monthly_stats && summary.monthly_stats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthly_stats} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip
                    formatter={(val) => [`${val}%`, 'Attendance Rate']}
                    contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none' }}
                  />
                  <Bar dataKey="percentage" fill="#2563EB" radius={[4, 4, 0, 0]} name="Attendance %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No monthly data points available yet
              </div>
            )}
          </div>
        </div>

        {/* Subject-Wise Summary Cards */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Subject Breakdown
          </h2>

          <div className="space-y-4 overflow-y-auto max-h-64 pr-1">
            {summary?.subject_breakdown?.map((subj, idx) => {
              const pct = subj.percentage;
              return (
                <div key={idx} className="p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-800">
                    <span className="truncate pr-2">{subj.subject_name}</span>
                    <span className={pct >= 75 ? 'text-emerald-700' : 'text-rose-700'}>{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div
                      className={`h-1.5 rounded-full ${pct >= 75 ? 'bg-emerald-600' : 'bg-rose-600'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500 mt-2">
                    <span>Attended: {subj.attended_classes}/{subj.total_classes}</span>
                    <span>Missed: {subj.absent_classes}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Attendance History Log Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Attendance Log & History</h2>
            <p className="text-xs text-gray-500 mt-0.5">Chronological record of every lecture attendance check</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Subjects</option>
                {uniqueSubjects.map((sub, i) => (
                  <option key={i} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Excused">Excused</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Course / Subject</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Remarks / Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                      {rec.date}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-gray-800">
                      {rec.subject_name}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        rec.status === 'Present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.status === 'Excused'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {rec.status === 'Present' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {rec.status === 'Excused' && <Info className="w-3.5 h-3.5 text-blue-600" />}
                        {rec.status === 'Absent' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-500">
                      {rec.remarks || 'Regular biometric session attendance'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                    No matching attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
