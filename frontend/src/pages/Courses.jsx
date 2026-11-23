import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import {
  BookOpen,
  User,
  Award,
  CalendarCheck,
  Search,
  ExternalLink,
  Loader2,
  X,
  FileText,
  Clock,
} from 'lucide-react';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        setCourses(res.data);
      } catch (err) {
        console.error('Failed to load courses', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filtered = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.faculty_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="My Courses">
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Top Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Enrolled Curriculum</h2>
            <p className="text-xs text-slate-500">
              Active registered subjects for current academic semester
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search course or professor..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        {/* Course Cards Grid */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-brand-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 border border-brand-200/50">
                      {course.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>{course.credits} Credits</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {course.name}
                  </h3>

                  <p className="text-xs text-slate-500 flex items-center space-x-1.5 mt-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{course.faculty_name}</span>
                  </p>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                    {course.description || 'Comprehensive curriculum covering theoretical foundations and practical laboratory components.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                  {/* Attendance gauge */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Subject Attendance</span>
                    <span
                      className={`font-bold ${
                        (course.attendance_percentage || 100) >= 75
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {course.attendance_percentage || 100}%
                    </span>
                  </div>

                  {/* Syllabus Progress */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 font-medium">Course Completion</span>
                      <span className="font-bold text-brand-600">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-brand-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCourse(course)}
                    className="w-full mt-2 py-2 px-4 rounded-xl border border-slate-200 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 text-xs font-semibold text-slate-700 flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <span>Course Details & Syllabus</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No matching courses found</h3>
            <p className="text-xs text-slate-500 mt-1">Try refining your search keyword</p>
          </div>
        )}

        {/* Course Details Modal */}
        {selectedCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
                    {selectedCourse.code}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-2">{selectedCourse.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedCourse.department}</p>
                </div>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Instructor:</span>
                    <span className="font-bold text-slate-900">{selectedCourse.faculty_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Credits:</span>
                    <span className="font-bold text-slate-900">{selectedCourse.credits} Credit Hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Semester:</span>
                    <span className="font-bold text-slate-900">Semester {selectedCourse.semester}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Attendance:</span>
                    <span className="font-bold text-emerald-600">{selectedCourse.attendance_percentage || 100}%</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1.5">Course Description & Outcomes</h4>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    {selectedCourse.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2">Core Modules</h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Module 1: Foundations & Analytical Paradigms</li>
                    <li>Module 2: Architectural Principles & Implementation</li>
                    <li>Module 3: Advanced Optimization & Empirical Analysis</li>
                    <li>Module 4: Laboratory Practicum & Real-World Capstone</li>
                  </ul>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors"
                >
                  Close Course Overview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Courses;
