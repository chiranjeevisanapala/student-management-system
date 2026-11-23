import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Filter,
  Search,
  RefreshCw,
  X
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Examinations() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/examinations');
      setExams(res.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to load examinations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const upcomingExams = exams.filter((e) => !e.is_completed);
  const completedExams = exams.filter((e) => e.is_completed);

  const currentList = activeTab === 'upcoming' ? upcomingExams : completedExams;

  const filteredExams = currentList.filter(
    (e) =>
      e.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.exam_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.exam_hall.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Examinations & Assessments</h1>
          <p className="text-sm text-gray-600 mt-1">
            Official examination schedules, hall allotments, and hall-ticket guidelines
          </p>
        </div>

        <button
          onClick={fetchExams}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Instructions Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 leading-relaxed">
          <span className="font-bold">Mandatory Examination Rules:</span> Students must carry their valid Student Identity Card & Hall Ticket to the examination hall. Reporting time is 30 minutes prior to exam commencement. Electronic devices including smartwatches and programmable calculators are strictly prohibited.
        </div>
      </div>

      {/* Tabs and Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'upcoming'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Upcoming Examinations
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 font-bold">
              {upcomingExams.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'completed'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Completed Examinations
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-bold">
              {completedExams.length}
            </span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search exam or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          />
        </div>
      </div>

      {/* Examinations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredExams.length > 0 ? (
          filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-blue-400 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    exam.exam_type === 'Final'
                      ? 'bg-rose-100 text-rose-800'
                      : exam.exam_type === 'Midterm'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {exam.exam_type} Exam
                  </span>

                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    exam.is_completed ? 'bg-gray-100 text-gray-600' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {exam.is_completed ? 'Completed' : 'Scheduled'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 mt-3">{exam.exam_name}</h3>
                <p className="text-xs font-semibold text-blue-900 mt-0.5">{exam.subject_name}</p>

                <div className="mt-4 space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Date: <span className="font-semibold text-gray-800">{exam.exam_date}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>Timing: <span className="font-semibold text-gray-800">{exam.start_time} - {exam.end_time}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>Hall: <span className="font-semibold text-gray-800">{exam.exam_hall}</span></span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedExam(exam)}
                  className="text-xs font-semibold text-blue-900 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View Instructions
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-xl p-12 border border-gray-200 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-800">No {activeTab} examinations found</h3>
            <p className="text-xs text-gray-500 mt-1">There are no matching examination records for this query.</p>
          </div>
        )}
      </div>

      {/* Instructions Modal */}
      {selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedExam(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900">{selectedExam.exam_name}</h3>
            <p className="text-xs text-blue-900 font-semibold mt-0.5">{selectedExam.subject_name}</p>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500">Exam Date:</span>
                <p className="font-semibold text-gray-800 mt-0.5">{selectedExam.exam_date}</p>
              </div>
              <div>
                <span className="text-gray-500">Hall Venue:</span>
                <p className="font-semibold text-gray-800 mt-0.5">{selectedExam.exam_hall}</p>
              </div>
              <div>
                <span className="text-gray-500">Timing:</span>
                <p className="font-semibold text-gray-800 mt-0.5">{selectedExam.start_time} - {selectedExam.end_time}</p>
              </div>
              <div>
                <span className="text-gray-500">Exam Type:</span>
                <p className="font-semibold text-gray-800 mt-0.5">{selectedExam.exam_type}</p>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Instructions & Guidelines</h4>
              <div className="text-xs text-gray-700 bg-blue-50/50 p-3.5 rounded-lg border border-blue-100 leading-relaxed whitespace-pre-wrap">
                {selectedExam.instructions || 'Standard University examination regulations apply. Report to the examination venue 30 minutes in advance with your hall ticket.'}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedExam(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition"
              >
                Close Instructions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
