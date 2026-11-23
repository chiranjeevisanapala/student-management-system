import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  Filter,
  Grid,
  List,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Timetable() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'weekly'
  const [selectedDay, setSelectedDay] = useState('Monday');

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/timetable');
      setTimetableSlots(res.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to load timetable', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Default selectedDay to current weekday if Mon-Sat
    const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    if (DAYS_OF_WEEK.includes(currentDayName)) {
      setSelectedDay(currentDayName);
    }
    fetchTimetable();
  }, []);

  const daySlots = timetableSlots.filter((slot) => slot.day_of_week === selectedDay);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Timetable</h1>
          <p className="text-sm text-gray-600 mt-1">
            Scheduled lecture hours, laboratory sessions, and classroom venues
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="bg-gray-100 p-1 rounded-lg border border-gray-200 flex items-center">
            <button
              onClick={() => setViewMode('daily')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === 'daily'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Day View
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === 'weekly'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Weekly Grid
            </button>
          </div>

          <button
            onClick={fetchTimetable}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Daily View Mode */}
      {viewMode === 'daily' && (
        <div className="space-y-6">
          {/* Day Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {DAYS_OF_WEEK.map((day) => {
              const count = timetableSlots.filter((s) => s.day_of_week === day).length;
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition whitespace-nowrap border ${
                    isSelected
                      ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  {day}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-blue-800 text-blue-100' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Slots list for the selected day */}
          <div className="space-y-3">
            {daySlots.length > 0 ? (
              daySlots.map((slot, index) => (
                <div
                  key={slot.id || index}
                  className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:border-blue-400 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex flex-col items-center justify-center font-bold text-xs flex-shrink-0">
                      <span>{slot.start_time?.slice(0, 5)}</span>
                      <span className="text-[10px] text-gray-400 font-normal">to</span>
                      <span>{slot.end_time?.slice(0, 5)}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                          Lecture
                        </span>
                        <h3 className="text-base font-bold text-gray-900">{slot.subject_name}</h3>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          Faculty: <span className="font-medium text-gray-800">{slot.faculty_name}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          Venue: <span className="font-medium text-gray-800">{slot.classroom}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          Timing: {slot.start_time} - {slot.end_time}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                      Confirmed
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-800">No classes scheduled for {selectedDay}</h3>
                <p className="text-xs text-gray-500 mt-1">Enjoy your study hours or free academic recess.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weekly Grid View Mode */}
      {viewMode === 'weekly' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <div className="min-w-[800px] grid grid-cols-6 divide-x divide-gray-200 border-b border-gray-200 bg-gray-50">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="p-3 text-center">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">{day}</span>
              </div>
            ))}
          </div>

          <div className="min-w-[800px] grid grid-cols-6 divide-x divide-gray-200">
            {DAYS_OF_WEEK.map((day) => {
              const slots = timetableSlots.filter((s) => s.day_of_week === day);
              return (
                <div key={day} className="p-2 space-y-2 min-h-[350px] bg-white">
                  {slots.length > 0 ? (
                    slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="p-2.5 rounded-lg border border-blue-100 bg-blue-50/60 hover:bg-blue-100/70 transition text-xs"
                      >
                        <div className="font-semibold text-blue-900 truncate">{slot.subject_name}</div>
                        <div className="text-[11px] text-gray-600 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {slot.classroom}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                          {slot.faculty_name}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-[11px] text-gray-400 italic">
                      No classes
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
