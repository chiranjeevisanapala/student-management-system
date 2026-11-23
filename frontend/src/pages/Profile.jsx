import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { useToast } from '../context/ToastContext';
import {
  User,
  Mail,
  Phone,
  Building,
  BookOpen,
  Calendar,
  Layers,
  Save,
  Loader2,
  ShieldCheck,
  Hash,
  Image as ImageIcon,
} from 'lucide-react';

const Profile = () => {
  const { success, error: toastError } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile');
        setProfile(res.data);
        setPhone(res.data.phone || '');
        setAvatarUrl(res.data.avatar_url || '');
      } catch (err) {
        toastError('Failed to load profile information');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/profile', {
        phone: phone.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      });
      setProfile(res.data);
      success('Personal profile details updated successfully!');
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="My Profile">
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Profile">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full bg-brand-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-3xl font-bold text-brand-700">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '';
                  }}
                />
              ) : (
                profile?.name?.charAt(0) || 'U'
              )}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Student Record</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{profile?.name}</h1>
            <p className="text-sm font-mono text-brand-600 font-semibold mt-0.5">
              Roll No: {profile?.roll_number}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {profile?.course} • {profile?.department}
            </p>
          </div>
        </div>

        {/* Academic Profile Details (Read Only & Editable Split) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Institutional Academic Record (Protected from tampering) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Building className="w-5 h-5 text-brand-600" />
                <span>Academic Record</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official institution credentials managed by the Registrar
              </p>
            </div>

            <div className="space-y-4 text-sm">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                  Student ID / Roll Number
                </span>
                <span className="font-mono font-bold text-slate-900 mt-1 block">
                  {profile?.roll_number}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                  Department
                </span>
                <span className="font-semibold text-slate-900 mt-1 block">
                  {profile?.department}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                  Program / Degree
                </span>
                <span className="font-semibold text-slate-900 mt-1 block">
                  {profile?.course}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                    Academic Year
                  </span>
                  <span className="font-semibold text-slate-900 mt-1 block">
                    {profile?.academic_year}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                    Semester
                  </span>
                  <span className="font-semibold text-slate-900 mt-1 block">
                    Semester {profile?.semester}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                  Date of Joining
                </span>
                <span className="font-semibold text-slate-900 mt-1 block">
                  {profile?.join_date}
                </span>
              </div>
            </div>
          </div>

          {/* Permitted Personal Contact Information Update */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <User className="w-5 h-5 text-emerald-600" />
                <span>Contact Information</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Students may update personal phone number and photograph URL
              </p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Academic Email (Official)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed select-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Primary academic email cannot be changed by student.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Profile Photograph URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-lg shadow-brand-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-70 mt-6"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Contact Changes</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
