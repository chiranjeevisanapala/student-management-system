import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Bell,
  Shield,
  User,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Notification Preferences State (Persisted in localStorage)
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem('sms_notification_prefs');
    return saved
      ? JSON.parse(saved)
      : {
          assignmentDeadlines: true,
          examAnnouncements: true,
          attendanceWarnings: true,
          emailDigest: false
        };
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      addToast('New password must be at least 6 characters long', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast('New password and confirmation password do not match', 'error');
      return;
    }

    try {
      setChangingPassword(true);
      await api.put('/api/settings/password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      addToast('Password updated successfully. Please use your new password next time you login.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update password. Verify your current password.', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleTogglePref = (key) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('sms_notification_prefs', JSON.stringify(updated));
      addToast('Preferences updated', 'success');
      return updated;
    });
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
    addToast('Logged out successfully', 'info');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account & Security Settings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your credentials, notification channels, and privacy configurations
        </p>
      </div>

      {/* Account Overview Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {user?.name?.slice(0, 2).toUpperCase() || 'ST'}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">{user?.name}</h2>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <span className="inline-block mt-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900">
              Role: {user?.role}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogoutClick}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
          Terminate Session / Logout
        </button>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <Lock className="w-5 h-5 text-blue-900" />
          <div>
            <h2 className="text-base font-bold text-gray-900">Change Account Password</h2>
            <p className="text-xs text-gray-500">Requires verification of your current password before updating</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {changingPassword ? 'Verifying & Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Notification Preferences Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <Bell className="w-5 h-5 text-blue-900" />
          <div>
            <h2 className="text-base font-bold text-gray-900">Notification Alerts & Frequency</h2>
            <p className="text-xs text-gray-500">Configure trigger conditions for automated portal notifications</p>
          </div>
        </div>

        <div className="space-y-4 max-w-xl">
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50">
            <div>
              <h4 className="text-xs font-bold text-gray-800">Assignment Deadlines</h4>
              <p className="text-[11px] text-gray-500">Receive reminders 48 hours prior to assignment cutoffs</p>
            </div>
            <button
              onClick={() => handleTogglePref('assignmentDeadlines')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                prefs.assignmentDeadlines ? 'bg-blue-900' : 'bg-gray-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                  prefs.assignmentDeadlines ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50">
            <div>
              <h4 className="text-xs font-bold text-gray-800">Examination Timetable Alerts</h4>
              <p className="text-[11px] text-gray-500">Notify when new examination dates and halls are published</p>
            </div>
            <button
              onClick={() => handleTogglePref('examAnnouncements')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                prefs.examAnnouncements ? 'bg-blue-900' : 'bg-gray-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                  prefs.examAnnouncements ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50">
            <div>
              <h4 className="text-xs font-bold text-gray-800">Attendance Threshold Alerts</h4>
              <p className="text-[11px] text-gray-500">Send immediate caution alert if attendance dips below 75%</p>
            </div>
            <button
              onClick={() => handleTogglePref('attendanceWarnings')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                prefs.attendanceWarnings ? 'bg-blue-900' : 'bg-gray-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                  prefs.attendanceWarnings ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
