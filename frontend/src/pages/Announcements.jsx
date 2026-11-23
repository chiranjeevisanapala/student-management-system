import React, { useState, useEffect } from 'react';
import {
  Bell,
  Pin,
  Search,
  Calendar,
  Building,
  User,
  RefreshCw,
  ExternalLink,
  X
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Announcements() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await api.get('/api/announcements', { params });
      setAnnouncements(res.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAnnouncements();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Official Announcements & Notices</h1>
          <p className="text-sm text-gray-600 mt-1">
            University administrative circulars, department updates, and academic notifications
          </p>
        </div>

        <button
          onClick={fetchAnnouncements}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-xs text-gray-500">
          Showing <span className="font-bold text-gray-900">{announcements.length}</span> published academic bulletins
        </p>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search circulars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length > 0 ? (
          announcements.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-5 transition shadow-sm hover:border-blue-400 ${
                item.is_pinned ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.is_pinned && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                        <Pin className="w-3.5 h-3.5 fill-amber-700" />
                        Pinned Notice
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                      {item.target_audience || 'All Students'}
                    </span>
                    {item.department && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {item.department}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 hover:text-blue-900 transition cursor-pointer"
                      onClick={() => setSelectedAnnouncement(item)}>
                    {item.title}
                  </h3>

                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                    {item.content}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      Issued by: <span className="font-semibold text-gray-700">{item.author_name}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      Date: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAnnouncement(item)}
                  className="p-2 text-gray-400 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition flex-shrink-0"
                  title="Read Full Notice"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-800">No announcements match your filter</h3>
            <p className="text-xs text-gray-500 mt-1">Please check back later for updates from academic deans.</p>
          </div>
        )}
      </div>

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              {selectedAnnouncement.is_pinned && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  <Pin className="w-3 h-3 fill-amber-700" />
                  Pinned
                </span>
              )}
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                {selectedAnnouncement.target_audience}
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-900">{selectedAnnouncement.title}</h3>

            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 mb-4">
              <span>Author: <strong className="text-gray-800">{selectedAnnouncement.author_name}</strong></span>
              <span>•</span>
              <span>Published: {new Date(selectedAnnouncement.created_at).toLocaleDateString()}</span>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
              {selectedAnnouncement.content}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
