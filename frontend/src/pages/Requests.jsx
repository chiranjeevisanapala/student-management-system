import React, { useState, useEffect } from 'react';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  History,
  Calendar,
  Send,
  RefreshCw,
  X
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const REQUEST_TYPES = [
  'Bonafide Certificate Request',
  'Leave Request',
  'Fee Certificate Request',
  'Transcript Request',
  'General Academic Request'
];

export default function Requests() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);

  // New Request Form State
  const [newRequestType, setNewRequestType] = useState(REQUEST_TYPES[0]);
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/requests');
      setRequests(res.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to load student requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!newDescription.trim()) {
      addToast('Please provide a reason or description for your academic request', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/requests', {
        request_type: newRequestType,
        description: newDescription.trim()
      });
      addToast('Academic request submitted successfully to administration', 'success');
      setIsModalOpen(false);
      setNewDescription('');
      fetchRequests();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to submit request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await api.get(`/api/requests/${id}`);
      setSelectedRequestDetails(res.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to fetch request timeline', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Under Review
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Requests & Helpdesk</h1>
          <p className="text-sm text-gray-600 mt-1">
            Submit applications for bonafide certificates, formal leaves, transcripts, and certificates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            New Academic Request
          </button>

          <button
            onClick={fetchRequests}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Application History & Real-Time Status</h2>
          <p className="text-xs text-gray-500 mt-0.5">Track approvals and official remarks issued by administrative staff</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3.5">Application ID</th>
                <th className="px-6 py-3.5">Request Type</th>
                <th className="px-6 py-3.5">Submitted Date</th>
                <th className="px-6 py-3.5">Current Status</th>
                <th className="px-6 py-3.5">Admin Remarks</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.length > 0 ? (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-900">
                      REQ-#{req.id.toString().padStart(4, '0')}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {req.request_type}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate">
                      {req.remarks || <span className="text-gray-400 italic">Awaiting review</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewDetails(req.id)}
                        className="text-xs font-semibold text-blue-900 hover:text-blue-700 inline-flex items-center gap-1"
                      >
                        <History className="w-3.5 h-3.5" />
                        Timeline
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">
                    No academic requests submitted yet. Click "New Academic Request" to apply.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900">Submit Academic Request</h3>
            <p className="text-xs text-gray-500 mt-0.5">Please provide accurate justification for official verification</p>

            <form onSubmit={handleCreateRequest} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Request Type</label>
                <select
                  value={newRequestType}
                  onChange={(e) => setNewRequestType(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {REQUEST_TYPES.map((type, i) => (
                    <option key={i} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Detailed Justification / Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="State the purpose of this request, dates if requesting leave, or relevant document requirements..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Details & History Modal */}
      {selectedRequestDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedRequestDetails(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-gray-500">
                REQ-#{selectedRequestDetails.request?.id?.toString().padStart(4, '0')}
              </span>
              {getStatusBadge(selectedRequestDetails.request?.status)}
            </div>

            <h3 className="text-lg font-bold text-gray-900 mt-2">
              {selectedRequestDetails.request?.request_type}
            </h3>

            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700">
              <p className="font-semibold text-gray-900 mb-1">Student Explanation:</p>
              <p>{selectedRequestDetails.request?.description}</p>
            </div>

            {selectedRequestDetails.request?.remarks && (
              <div className="mt-3 p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-900">
                <p className="font-semibold mb-1">Administrative Remarks:</p>
                <p>{selectedRequestDetails.request?.remarks}</p>
              </div>
            )}

            {/* Approval History Timeline */}
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-900" />
                Audit Trail & History
              </h4>

              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 pl-8">
                {selectedRequestDetails.history?.map((h, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-8 top-1 w-2.5 h-2.5 rounded-full bg-blue-900 border-2 border-white" />
                    <div className="text-xs">
                      <span className="font-semibold text-gray-900">{h.action}</span> by{' '}
                      <span className="font-medium text-gray-700">{h.changed_by}</span>
                      <p className="text-gray-500 text-[11px] mt-0.5">{h.notes}</p>
                      <span className="text-[10px] text-gray-400 mt-0.5 block">
                        {h.created_at ? new Date(h.created_at).toLocaleString() : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedRequestDetails(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
