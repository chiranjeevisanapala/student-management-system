import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Search,
  Filter,
  BookOpen,
  Calendar,
  User,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const MATERIAL_TYPES = ['all', 'PDF', 'Notes', 'Presentation', 'Reference'];

export default function StudyMaterials() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedType !== 'all') params.material_type = selectedType;

      const res = await api.get('/api/materials', { params });
      setMaterials(res.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to load study materials', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [selectedType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMaterials();
  };

  const handleDownload = (material) => {
    try {
      if (material.file_url && material.file_url.startsWith('data:')) {
        // Base64 file download
        const link = document.createElement('a');
        link.href = material.file_url;
        link.download = material.file_name || `${material.title}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast(`Downloading ${material.file_name}...`, 'success');
      } else {
        // Standard link / placeholder file download
        const blob = new Blob([`Official Academic Resource: ${material.title}\nCourse: ${material.subject_name}\nUploaded by: ${material.uploaded_by}`], {
          type: 'text/plain;charset=utf-8'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = material.file_name || `${material.title}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addToast(`Downloading ${material.file_name}...`, 'success');
      }
    } catch (e) {
      addToast('Download failed. Please try again.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Study Materials & Notes</h1>
          <p className="text-sm text-gray-600 mt-1">
            Faculty-approved syllabus notes, lecture presentations, and academic references
          </p>
        </div>

        <button
          onClick={fetchMaterials}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Material Type Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {MATERIAL_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                selectedType === type
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type === 'all' ? 'All Materials' : type}
            </button>
          ))}
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by topic or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Materials Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {materials.length > 0 ? (
          materials.map((mat) => (
            <div
              key={mat.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-blue-400 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    mat.material_type === 'PDF'
                      ? 'bg-rose-100 text-rose-800'
                      : mat.material_type === 'Presentation'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {mat.material_type}
                  </span>

                  <span className="text-[11px] font-medium text-gray-500">
                    {mat.file_size || '2.4 MB'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 mt-3 line-clamp-2">{mat.title}</h3>
                <p className="text-xs font-semibold text-blue-900 mt-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-700" />
                  {mat.subject_name}
                </p>

                <div className="mt-4 space-y-1.5 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>Uploaded by: <span className="font-medium text-gray-700">{mat.uploaded_by}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">File: {mat.file_name}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  {mat.created_at ? new Date(mat.created_at).toLocaleDateString() : 'Recent'}
                </span>

                <button
                  onClick={() => handleDownload(mat)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                >
                  <Download className="w-3.5 h-3.5 text-blue-900" />
                  Download
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-xl p-12 border border-gray-200 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-800">No study materials found</h3>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your search query or material type filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
