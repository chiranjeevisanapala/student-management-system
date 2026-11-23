import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { useToast } from '../context/ToastContext';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileCheck,
  Send,
  Loader2,
  X,
  Award,
} from 'lucide-react';

const Assignments = () => {
  const { success, error: toastError } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [submittingModal, setSubmittingModal] = useState(null);

  // Form submission state
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/assignments');
      setAssignments(res.data);
    } catch (err) {
      console.error('Failed to load assignments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toastError('File size exceeds 10MB limit');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleOpenSubmit = (assignment) => {
    setSubmittingModal(assignment);
    setSubmissionText(assignment.submission_text || '');
    setSelectedFile(null);
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!submissionText.trim() && !selectedFile) {
      toastError('Please provide either text submission notes or attach a file.');
      return;
    }

    setSubmitting(true);

    try {
      let fileDataB64 = null;
      let fileName = null;

      if (selectedFile) {
        fileName = selectedFile.name;
        fileDataB64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      await api.post(`/assignments/${submittingModal.id}/submit`, {
        submission_text: submissionText.trim() || null,
        file_name: fileName,
        file_data_base64: fileDataB64,
      });

      success('Assignment submitted successfully!');
      setSubmittingModal(null);
      fetchAssignments();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = assignments.filter((a) => {
    if (filter === 'all') return true;
    return a.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <Layout title="Assignments">
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Filter Navigation Bar */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Academic Coursework</h2>
            <p className="text-xs text-slate-500">Track deadlines, submit projects, and review grades</p>
          </div>

          <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200/60 overflow-x-auto w-full sm:w-auto">
            {['all', 'pending', 'submitted', 'graded'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all capitalize ${
                  filter === status
                    ? 'bg-white text-brand-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Assignments List */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((item) => {
              const isGraded = item.status === 'Graded';
              const isSubmitted = item.status === 'Submitted' || item.status === 'Late';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg">
                        {item.subject_name}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          isGraded
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : isSubmitted
                            ? 'bg-sky-50 text-sky-700 border border-sky-200/60'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">Assigned by {item.faculty_name}</p>

                    <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                      {item.description || 'Complete the assignment guidelines and submit your report before the scheduled deadline.'}
                    </p>

                    <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5 text-slate-500">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Due Date: <strong className="text-slate-800">{item.due_date}</strong></span>
                      </div>
                      <span className="font-bold text-slate-700">{item.max_marks} Maximum Marks</span>
                    </div>

                    {/* Graded Marks & Feedback Display */}
                    {isGraded && (
                      <div className="mt-4 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center space-x-1.5">
                            <Award className="w-4 h-4 text-emerald-600" />
                            <span>Awarded Grade:</span>
                          </span>
                          <span className="font-extrabold text-sm text-emerald-700">
                            {item.marks} / {item.max_marks} Marks
                          </span>
                        </div>
                        {item.feedback && (
                          <p className="text-emerald-800 pt-1 text-[11px] italic">
                            "{item.feedback}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submission Action */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    {item.file_name && (
                      <span className="text-xs text-slate-500 flex items-center space-x-1 truncate max-w-[200px]">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="truncate">{item.file_name}</span>
                      </span>
                    )}

                    <button
                      onClick={() => handleOpenSubmit(item)}
                      className={`ml-auto py-2 px-4 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 ${
                        isGraded
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : isSubmitted
                          ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200'
                          : 'bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20'
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{isSubmitted || isGraded ? 'Update Submission' : 'Submit Work'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No coursework in this category</h3>
            <p className="text-xs text-slate-500 mt-1">All assignments matching the filter are cleared!</p>
          </div>
        )}

        {/* Submit Assignment Modal */}
        {submittingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                    {submittingModal.subject_name}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{submittingModal.title}</h3>
                  <p className="text-xs text-slate-500">Max Marks: {submittingModal.max_marks}</p>
                </div>
                <button
                  onClick={() => setSubmittingModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitAssignment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Written Explanation / Repository Link
                  </label>
                  <textarea
                    rows={4}
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Enter your project notes, GitHub repo link, or documentation..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Upload Project Document / Archive (PDF, ZIP, TAR)
                  </label>
                  <div className="p-4 border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="w-8 h-8 text-brand-500 mb-2" />
                    {selectedFile ? (
                      <span className="text-xs font-bold text-slate-800">{selectedFile.name}</span>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-slate-700">
                          Click to browse or drag file here
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Maximum size: 10MB</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setSubmittingModal(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-600/20 flex items-center space-x-2 disabled:opacity-70"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Project</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Assignments;
