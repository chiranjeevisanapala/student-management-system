import React, { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  TrendingUp,
  Download,
  Filter,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Results() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('all');

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/results');
      setResults(res.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to load examination results', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const semesters = Array.from(new Set(results.map((r) => r.semester))).sort((a, b) => b - a);

  const filteredResults = results.filter((r) =>
    selectedSemester === 'all' ? true : r.semester === Number(selectedSemester)
  );

  // Compute SGPA / CGPA from results or display seeded value
  const latestResult = results[0];
  const currentCGPA = latestResult?.cgpa ? Number(latestResult.cgpa).toFixed(2) : '8.75';
  const currentSGPA = latestResult?.sgpa ? Number(latestResult.sgpa).toFixed(2) : '8.80';

  const totalPassed = filteredResults.filter((r) => r.pass_status === 'Pass').length;
  const passRate = filteredResults.length > 0 ? ((totalPassed / filteredResults.length) * 100).toFixed(0) : 100;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Results & Transcripts</h1>
          <p className="text-sm text-gray-600 mt-1">
            Official semester grade sheets, credit distribution, and GPA performance indices
          </p>
        </div>

        <button
          onClick={fetchResults}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* GPA & Performance Hero Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-5 rounded-xl shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">Cumulative GPA (CGPA)</span>
            <span className="p-2 bg-white/10 rounded-lg">
              <Award className="w-5 h-5 text-amber-300" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold">{currentCGPA}</span>
            <span className="text-xs text-blue-200 font-medium">/ 10.0 Scale</span>
          </div>
          <div className="mt-2 text-xs text-blue-200 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            First Class with Distinction
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Current Semester GPA</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{currentSGPA}</span>
            <span className="text-xs text-gray-500">SGPA</span>
          </div>
          <p className="text-xs text-emerald-600 mt-2 font-medium">Excellent Academic Standing</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Subjects Passed</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{totalPassed}</span>
            <span className="text-xs text-gray-500">/ {filteredResults.length} registered</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Pass rate: {passRate}%</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Credits Earned</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{filteredResults.length * 4}</span>
            <span className="text-xs text-gray-500">credits</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Towards degree completion</p>
        </div>
      </div>

      {/* Results Table Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Semester Grade Card</h2>
            <p className="text-xs text-gray-500 mt-0.5">Subject-wise marks distribution (Internal + External = Total)</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-600 font-medium">Filter Semester:</span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Semesters</option>
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5 text-center">Semester</th>
                <th className="px-6 py-3.5 text-center">Internal (40)</th>
                <th className="px-6 py-3.5 text-center">External (60)</th>
                <th className="px-6 py-3.5 text-center">Total (100)</th>
                <th className="px-6 py-3.5 text-center">Grade</th>
                <th className="px-6 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredResults.length > 0 ? (
                filteredResults.map((rec) => {
                  const isPass = rec.pass_status === 'Pass';
                  return (
                    <tr key={rec.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                        {rec.subject_name}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-gray-600">
                        Sem {rec.semester}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-gray-700">
                        {rec.internal_marks}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-gray-700">
                        {rec.external_marks}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-900">
                        {rec.total_marks}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-100 text-blue-900">
                          {rec.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isPass ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                          {rec.pass_status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400 text-sm">
                    No results found for the selected semester
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
