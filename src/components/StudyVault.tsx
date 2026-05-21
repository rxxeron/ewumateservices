import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { StudyMaterial } from '../types';
import { 
  Search, 
  Filter, 
  Download, 
  FileText, 
  Image, 
  FileCode, 
  Layers, 
  Calendar, 
  User, 
  Cpu,
  BookOpen,
  Plus,
  Clock,
  Sparkles,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const FILE_TYPES = [
  'Term Paper',
  'Mid Questions',
  'Final Question',
  'Final Questions',
  'Quiz Questions',
  'Course Outline',
  'Slide',
  'Sample Code',
  'Book',
  'Lab Manual',
  'Lab Report',
  'Project Report',
  'Lecture Notes',
  'Assignment Solution',
  'Syllabus',
  'Cheat Sheet',
  'Class Handout',
  'Other'
];

export const StudyVault: React.FC = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Filters
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [semesters, setSemesters] = useState<string[]>([]);
  
  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [debouncedSearch, selectedSemester, selectedFileType]);

  const fetchSemesters = async () => {
    try {
      const { data, error } = await supabase
        .from('semesters')
        .select('code, title')
        .order('code', { ascending: false });

      if (error) throw error;
      if (data) {
        setSemesters(data.map(s => s.code));
      }
    } catch (err: any) {
      console.error('Error fetching semesters:', err);
    }
  };

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('study_materials')
        .select(`
          *,
          profiles:uploader_id(full_name, student_id)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (debouncedSearch.trim()) {
        const q = debouncedSearch.trim();
        query = query.or(`file_name.ilike.%${q}%,course_code.ilike.%${q}%,faculty_initial.ilike.%${q}%`);
      }

      if (selectedSemester !== 'all') {
        query = query.eq('semester', selectedSemester);
      }

      if (selectedFileType !== 'all') {
        query = query.eq('file_type', selectedFileType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setMaterials(data || []);
    } catch (err: any) {
      console.error('Error fetching study materials:', err);
      toast.error('Failed to load study vault materials');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : '';
    if (ext === 'pdf') {
      return <FileText className="w-8 h-8 text-rose-500" />;
    } else if (['doc', 'docx'].includes(ext || '')) {
      return <FileText className="w-8 h-8 text-blue-500" />;
    } else if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '')) {
      return <Image className="w-8 h-8 text-emerald-500" />;
    } else if (['py', 'js', 'ts', 'java', 'cpp', 'c', 'html', 'css', 'dart'].includes(ext || '')) {
      return <FileCode className="w-8 h-8 text-indigo-500" />;
    }
    return <Layers className="w-8 h-8 text-amber-500" />;
  };

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatSemester = (sem: string | null) => {
    if (!sem) return 'N/A';
    // Format e.g. spring2026 to "Spring 2026"
    return sem.replace(/^(spring|summer|fall)(\d{4})$/i, (_, season, year) => {
      return season.charAt(0).toUpperCase() + season.slice(1).toLowerCase() + ' ' + year;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
      {/* Upper Glowing Orbs */}
      <div className="absolute top-[-5%] left-[20%] w-[30rem] h-[30rem] bg-ewu-green/5 rounded-full blur-[140px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute top-[10%] right-[10%] w-[25rem] h-[25rem] bg-ewu-blue/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 relative z-10 pt-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-ewu-green/10 text-ewu-green dark:text-green-400 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-4 border border-ewu-green/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EWUmate Ecosystem</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-800 dark:text-white leading-tight">
            Study Materials <span className="bg-gradient-to-r from-ewu-green to-green-500 bg-clip-text text-transparent">Vault</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-base font-medium max-w-2xl">
            Access, download, and contribute verified course materials, question papers, term papers, slides, and files uploaded by your fellow classmates.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 self-start md:self-end">
          <Link
            to="/vault/my-uploads"
            className="px-5 py-3 rounded-2xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5 transition-all flex items-center gap-2 text-sm shadow-sm"
          >
            <Clock className="w-4 h-4 text-ewu-green" />
            <span>My Uploads</span>
          </Link>
          <Link
            to="/vault/upload"
            className="btn-primary inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Upload File</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-card rounded-[2rem] p-6 mb-8 relative z-20 shadow-xl border-white/20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Search bar */}
          <div className="lg:col-span-6 relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-slate-400 group-focus-within:text-ewu-green transition-colors w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search file name, course code (e.g. CSE101), or faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12 h-13"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Semester Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="input-field h-13 appearance-none cursor-pointer pr-10 font-medium text-slate-700 dark:text-slate-200 bg-no-repeat bg-[right_1rem_center] bg-[length:1rem]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`
              }}
            >
              <option value="all">📅 All Semesters</option>
              {semesters.map(code => (
                <option key={code} value={code}>
                  📅 {formatSemester(code)}
                </option>
              ))}
            </select>
          </div>

          {/* Document Type Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
              className="input-field h-13 appearance-none cursor-pointer pr-10 font-medium text-slate-700 dark:text-slate-200 bg-no-repeat bg-[right_1rem_center] bg-[length:1rem]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`
              }}
            >
              <option value="all">📂 All Doc Types</option>
              {FILE_TYPES.map(type => (
                <option key={type} value={type}>
                  📂 {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable Horizontal Filter Chips */}
        <div className="mt-5 pt-4 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
              <Filter className="w-3.5 h-3.5" /> Quick Filters:
            </span>
            
            {/* Semester Active Chip */}
            {selectedSemester !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-ewu-blue/10 dark:bg-blue-500/10 text-ewu-blue dark:text-blue-300 text-xs font-bold rounded-lg border border-ewu-blue/20 dark:border-blue-500/20 whitespace-nowrap">
                {formatSemester(selectedSemester)}
                <button onClick={() => setSelectedSemester('all')} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Type Active Chip */}
            {selectedFileType !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs font-bold rounded-lg border border-amber-500/20 whitespace-nowrap">
                {selectedFileType}
                <button onClick={() => setSelectedFileType('all')} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Search active indicator */}
            {searchTerm && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-ewu-green/10 text-ewu-green dark:text-green-300 text-xs font-bold rounded-lg border border-ewu-green/20 whitespace-nowrap">
                Search: "{searchTerm.length > 15 ? searchTerm.substring(0, 12) + '...' : searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedSemester === 'all' && selectedFileType === 'all' && !searchTerm && (
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 italic">
                None active. Try searching or selecting filters!
              </span>
            )}
          </div>

          {(selectedSemester !== 'all' || selectedFileType !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedSemester('all');
                setSelectedFileType('all');
                setSearchTerm('');
              }}
              className="text-xs font-black text-red-500 hover:text-red-600 dark:hover:text-red-400 uppercase tracking-widest active:scale-95 transition-all"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Study Materials Grid */}
      <div className="relative z-10 min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-ewu-green border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 dark:text-slate-400 font-bold tracking-wide uppercase text-xs">Querying database...</p>
          </div>
        ) : materials.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {materials.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="glass-card hover:border-ewu-green/30 dark:hover:border-ewu-green/20 rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-ewu-green/5 flex flex-col justify-between group h-full relative"
                >
                  <div>
                    {/* Header: File Extension Icon & Type badge */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl group-hover:scale-110 transition-transform duration-300 border border-slate-200/50 dark:border-white/5">
                        {getFileIcon(item.file_name)}
                      </div>
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-500/20">
                        {item.file_type || 'Other'}
                      </span>
                    </div>

                    {/* File Title */}
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight leading-snug line-clamp-2 group-hover:text-ewu-green transition-colors mb-4" title={item.file_name}>
                      {item.file_name}
                    </h3>

                    {/* Metadata chips */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-ewu-green/10 text-ewu-green dark:text-green-300 rounded-lg text-xs font-extrabold uppercase tracking-wide border border-ewu-green/10">
                        {item.course_code || 'General'}
                      </span>
                      {item.faculty_initial && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-extrabold uppercase border border-indigo-500/10">
                          {item.faculty_initial}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-ewu-blue/10 dark:bg-blue-500/10 text-ewu-blue dark:text-blue-300 rounded-lg text-xs font-extrabold border border-ewu-blue/10 dark:border-blue-500/10">
                        {formatSemester(item.semester)}
                      </span>
                    </div>
                  </div>

                  {/* Footer block: size, uploader, & download trigger */}
                  <div className="pt-4 border-t border-slate-200/50 dark:border-white/5 flex flex-col gap-4">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1 font-bold">
                        <Cpu className="w-3.5 h-3.5 text-ewu-green" />
                        {formatBytes(item.file_size_bytes)}
                      </span>
                      <span className="flex items-center gap-1 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-ewu-blue" />
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Uploader name */}
                    {item.profiles?.full_name && (
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        <User className="w-4 h-4 text-ewu-green" />
                        <span className="truncate">By: {item.profiles.full_name}</span>
                      </div>
                    )}

                    {/* Action Button */}
                    <a
                      href={`https://drive.google.com/file/d/${item.drive_file_id}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 hover:bg-ewu-green dark:bg-white/5 dark:hover:bg-ewu-green text-slate-700 hover:text-white dark:text-slate-300 dark:hover:text-white font-bold transition-all border border-slate-200 dark:border-white/5 hover:border-ewu-green hover:shadow-lg hover:shadow-ewu-green/20 text-sm active:scale-95"
                    >
                      <span>Download File</span>
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-[2rem] p-10 border-white/20">
            <div className="bg-slate-100 dark:bg-slate-800/80 p-5 rounded-full mb-4">
              <BookOpen className="w-10 h-10 text-slate-400 dark:text-slate-500 animate-pulse" />
            </div>
            <h3 className="font-bold text-xl text-slate-700 dark:text-slate-200">No Materials Found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2 font-medium text-sm">
              We couldn't find any approved materials matching your criteria. Try adjusting your search query or filter chips!
            </p>
            <button
              onClick={() => {
                setSelectedSemester('all');
                setSelectedFileType('all');
                setSearchTerm('');
              }}
              className="mt-6 px-5 py-2.5 bg-ewu-green/10 text-ewu-green dark:text-green-400 font-bold text-xs rounded-xl hover:bg-ewu-green/20 transition-all border border-ewu-green/20"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
