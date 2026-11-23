import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle,
  Clock,
  BookOpen,
  Calendar,
  AlertTriangle,
  FileText,
  CheckCheck,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Notifications() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      addToast('Notification marked as read', 'success');
    } catch (err) {
      addToast('Failed to update notification', 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      addToast('All notifications marked as read', 'success');
    } catch (err) {
      addToast('Failed to mark all as read', 'error');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment':
        return <FileText className="w-5 h-5 text-indigo-600" />;
      case 'exam':
        return <Calendar className="w-5 h-5 text-rose-600" />;
      case 'attendance':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'request':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-900" />;
    }
  };

  const filteredNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.is_read : true
  );

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications & Alerts</h1>
          <p className="text-sm text-gray-600 mt-1">
            Real-time assignment deadlines, exam alerts, and administrative status updates
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition shadow-sm"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All as Read
            </button>
          )}

          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-3 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            filter === 'all'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Notifications
          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 font-bold">
            {notifications.length}
          </span>
        </button>

        <button
          onClick={() => setFilter('unread')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            filter === 'unread'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Unread Alerts
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-800 font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 shadow-sm ${
                !n.is_read
                  ? 'bg-blue-50/40 border-blue-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                  !n.is_read ? 'bg-white shadow-xs' : 'bg-gray-100'
                }`}>
                  {getNotificationIcon(n.notification_type)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-bold ${!n.is_read ? 'text-blue-950' : 'text-gray-800'}`}>
                      {n.title}
                    </h3>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    )}
                  </div>

                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {n.message}
                  </p>

                  <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-400">
                    <span>{n.created_at ? new Date(n.created_at).toLocaleString() : 'Just now'}</span>

                    {n.link && (
                      <Link
                        to={n.link}
                        className="text-blue-900 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        View Details <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-xs flex-shrink-0"
                >
                  Mark as read
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-800">You're completely caught up!</h3>
            <p className="text-xs text-gray-500 mt-1">There are no {filter === 'unread' ? 'unread ' : ''}notifications at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
