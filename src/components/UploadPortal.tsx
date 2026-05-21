import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  X, 
  Search, 
  User, 
  AlertTriangle,
  FilePlus,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

interface UploadPortalProps {
  user: any;
}

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

export const UploadPortal: React.FC<UploadPortalProps> = ({ user }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileTypes, setFileTypes] = useState<Record<string, string>>({}); // Maps index/name to selected document type

  // Form Fields
  const [courseCode, setCourseCode] = useState('');
  const [selectedCourseName, setSelectedCourseName] = useState('');
  const [facultyInitial, setFacultyInitial] = useState('');
  const [selectedFacultyName, setSelectedFacultyName] = useState('');
  const [semester, setSemester] = useState('');

  // Dropdown list options
  const [semesterOptions, setSemesterOptions] = useState<{ code: string; title: string }[]>([]);
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(true);

  // Search autocompletes
  const [courseSuggestions, setCourseSuggestions] = useState<{ code: string; name: string }[]>([]);
  const [showCourseSuggestions, setShowCourseSuggestions] = useState(false);
  const [courseQuery, setCourseQuery] = useState('');

  const [facultySuggestions, setFacultySuggestions] = useState<{ short_name: string; full_name: string }[]>([]);
  const [showFacultySuggestions, setShowFacultySuggestions] = useState(false);
  const [facultyQuery, setFacultyQuery] = useState('');

  // Uploading and drag-and-drop state
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, { percent: number; status: 'waiting' | 'uploading' | 'saving' | 'done' | 'failed' }>>({});

  useEffect(() => {
    fetchSemesters();
  }, []);

  // Fetch course autocomplete
  useEffect(() => {
    if (courseQuery.trim().length < 2) {
      setCourseSuggestions([]);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const q = courseQuery.trim();
        const { data, error } = await supabase
          .from('course_metadata')
          .select('code, name')
          .or(`code.ilike.%${q}%,name.ilike.%${q}%`)
          .order('code', { ascending: true })
          .limit(6);

        if (!error && data) {
          setCourseSuggestions(data);
        }
      } catch (err) {
        console.error(err);
      }
    }, 200);

    return () => clearTimeout(delay);
  }, [courseQuery]);

  // Fetch faculty autocomplete
  useEffect(() => {
    if (facultyQuery.trim().length < 2) {
      setFacultySuggestions([]);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const q = facultyQuery.trim();
        const { data, error } = await supabase
          .from('faculty_directory')
          .select('short_name, full_name')
          .or(`short_name.ilike.%${q}%,full_name.ilike.%${q}%`)
          .order('short_name', { ascending: true })
          .limit(6);

        if (!error && data) {
          setFacultySuggestions(data.map(d => ({ short_name: d.short_name, full_name: d.full_name || '' })));
        }
      } catch (err) {
        console.error(err);
      }
    }, 200);

    return () => clearTimeout(delay);
  }, [facultyQuery]);

  const fetchSemesters = async () => {
    try {
      setIsLoadingSemesters(true);
      const { data, error } = await supabase
        .from('semesters')
        .select('code, title')
        .order('code', { ascending: false });

      if (error) throw error;
      if (data) {
        setSemesterOptions(data.map(s => ({ code: s.code, title: s.title || s.code })));
        if (data.length > 0) {
          setSemester(data[0].code);
        }
      }
    } catch (err: any) {
      console.error('Error fetching semesters:', err);
      // Hardcoded fallback list
      setSemesterOptions([
        { code: 'spring2026', title: 'Spring 2026' },
        { code: 'summer2026', title: 'Summer 2026' },
        { code: 'fall2025', title: 'Fall 2025' }
      ]);
      setSemester('spring2026');
    } finally {
      setIsLoadingSemesters(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    if (e.dataTransfer.files) {
      const files: File[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (validateFile(file)) {
          files.push(file);
        }
      }
      addFiles(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (validateFile(file)) {
          files.push(file);
        }
      }
      addFiles(files);
    }
  };

  const validateFile = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
    
    if (!ext || !validExtensions.includes(ext)) {
      toast.error(`Invalid extension for ${file.name}. Allowed: PDF, DOC, DOCX, JPG, PNG`);
      return false;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error(`${file.name} is too large. Max file size: 50MB`);
      return false;
    }

    return true;
  };

  const addFiles = (files: File[]) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      files.forEach(f => {
        if (!newFiles.some(existing => existing.name === f.name && existing.size === f.size)) {
          newFiles.push(f);
        }
      });
      return newFiles;
    });

    setFileTypes(prev => {
      const newTypes = { ...prev };
      files.forEach(f => {
        if (!newTypes[f.name]) {
          newTypes[f.name] = 'Other';
        }
      });
      return newTypes;
    });
  };

  const removeFile = (index: number, name: string) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFileTypes(prev => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const handleFileTypeSelect = (fileName: string, type: string) => {
    setFileTypes(prev => ({
      ...prev,
      [fileName]: type
    }));
  };

  const triggerUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    if (!courseCode.trim()) {
      toast.error('Please input or select a Course Code');
      return;
    }

    if (!facultyInitial.trim()) {
      toast.error('Please input or select Faculty Initials');
      return;
    }

    setIsUploading(true);
    
    // Initialize progress map
    const initialProgress: typeof uploadProgress = {};
    selectedFiles.forEach(f => {
      initialProgress[f.name] = { percent: 0, status: 'waiting' };
    });
    setUploadProgress(initialProgress);

    try {
      const normalizedCourse = courseCode.replace(/[\s-]/g, '').toUpperCase();
      const normalizedFaculty = facultyInitial.replace(/[\s\.]/g, '').toUpperCase();

      for (const file of selectedFiles) {
        // Step 1: Get upload URL from Edge Function
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { percent: 10, status: 'uploading' }
        }));

        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('get-drive-upload-url', {
          body: {
            fileName: file.name,
            fileSizeBytes: file.size,
            mimeType: file.type || 'application/octet-stream'
          }
        });

        if (edgeError || !edgeData?.uploadUrl) {
          throw new Error(edgeError?.message || `Failed to get Drive upload session for ${file.name}`);
        }

        const { uploadUrl, driveAccountId } = edgeData;

        // Step 2: Binary PUT directly to Google Drive URL
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { percent: 30, status: 'uploading' }
        }));

        const driveResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Length': file.size.toString(),
          },
          body: file
        });

        if (!driveResponse.ok) {
          throw new Error(`Direct Drive upload failed for ${file.name}`);
        }

        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { percent: 80, status: 'saving' }
        }));

        // Google Drive resumable PUT endpoint returns complete file details on completion
        const jsonResponse = await driveResponse.text();
        let driveFileId = 'unknown';
        try {
          if (jsonResponse) {
            const parsed = JSON.parse(jsonResponse);
            if (parsed.id) driveFileId = parsed.id;
          }
        } catch (e) {
          // Fallback parsing
          const match = jsonResponse.match(/"id":\s*"([^"]+)"/);
          if (match) driveFileId = match[1];
        }

        // Step 3: Insert metadata to Supabase
        const fileType = fileTypes[file.name] || 'Other';
        const { error: insertError } = await supabase
          .from('study_materials')
          .insert({
            uploader_id: user.id,
            faculty_initial: normalizedFaculty,
            course_code: normalizedCourse,
            semester: semester,
            file_type: fileType,
            drive_account_id: driveAccountId,
            drive_file_id: driveFileId,
            file_name: file.name,
            file_size_bytes: file.size,
            status: 'pending' // pending review
          });

        if (insertError) {
          throw new Error(`Database logging failed: ${insertError.message}`);
        }

        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { percent: 100, status: 'done' }
        }));
      }

      toast.success('All files uploaded successfully for review!');
      setTimeout(() => {
        navigate('/vault/my-uploads');
      }, 1500);

    } catch (err: any) {
      console.error('Upload sequence error:', err);
      toast.error(`Upload aborted: ${err.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : '';
    if (ext === 'pdf') {
      return <FileText className="w-6 h-6 text-rose-500" />;
    } else if (['doc', 'docx'].includes(ext || '')) {
      return <FileText className="w-6 h-6 text-blue-500" />;
    }
    return <Layers className="w-6 h-6 text-amber-500" />;
  };


  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 relative">
      {/* Glow */}
      <div className="absolute top-[-5%] left-[20%] w-[25rem] h-[25rem] bg-ewu-green/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

      {/* Back button */}
      <div className="mb-6 pt-4">
        <Link
          to="/vault"
          className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold transition-all text-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Study Vault</span>
        </Link>
      </div>

      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/5 pb-8 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 dark:text-white leading-tight">
            Contribute to <span className="bg-gradient-to-r from-ewu-green to-green-500 bg-clip-text text-transparent">Study Vault</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm font-semibold">
            Upload course outline, mid/final exams, slides, or sample codes to help your peers.
          </p>
        </div>
      </div>

      <form onSubmit={triggerUpload} className="space-y-8 pb-20 relative z-10">
        {/* Global Metadata section */}
        <div className="glass-card backdrop-blur-none rounded-[2.5rem] p-8 border-white/20 shadow-xl space-y-6 relative z-20">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 border-b border-slate-200/50 dark:border-white/5 pb-3">
            📍 Global Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Academic Semester dropdown */}
            <div className="space-y-1.5">
              <label className="label-text">Academic Semester</label>
              {isLoadingSemesters ? (
                <div className="h-13 bg-slate-100 dark:bg-slate-800/80 rounded-xl animate-pulse flex items-center px-4 text-xs font-bold text-slate-400">
                  Loading Semesters...
                </div>
              ) : (
                <select
                  value={semester}
                  disabled={isUploading}
                  onChange={(e) => setSemester(e.target.value)}
                  className="input-field h-13 appearance-none cursor-pointer pr-10 bg-no-repeat bg-[right_1rem_center] bg-[length:1rem] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`
                  }}
                >
                  {semesterOptions.map(opt => (
                    <option key={opt.code} value={opt.code}>
                      📅 {opt.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Course Code Autocomplete */}
            <div className="space-y-1.5 relative">
              <label className="label-text">Course Code</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="text-slate-400 group-focus-within:text-ewu-green transition-colors w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. CSE101"
                  value={courseCode}
                  disabled={isUploading}
                  onChange={(e) => {
                    setCourseCode(e.target.value);
                    setCourseQuery(e.target.value);
                    setSelectedCourseName(''); // Clear selection preview when user types manually
                    setShowCourseSuggestions(true);
                  }}
                  onFocus={() => !isUploading && setShowCourseSuggestions(true)}
                  className="input-field pl-10 h-13 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Selected Course Preview Badge */}
              <AnimatePresence>
                {courseCode && selectedCourseName && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mt-2 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-ewu-green/10 border border-ewu-green/20 text-ewu-green dark:text-green-400 text-xs font-bold shadow-sm"
                  >
                    <span className="truncate flex items-center gap-1.5 min-w-0">
                      <span role="img" aria-label="book" className="shrink-0">📖</span>
                      <span className="truncate font-semibold max-w-[180px] md:max-w-[200px]" title={selectedCourseName}>
                        {selectedCourseName}
                      </span>
                    </span>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => {
                        setCourseCode('');
                        setSelectedCourseName('');
                        setCourseQuery('');
                      }}
                      className="p-1 rounded-md hover:bg-ewu-green/20 dark:hover:bg-ewu-green/30 transition-all text-ewu-green dark:text-green-400 disabled:opacity-50 shrink-0"
                      title="Clear selection"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {showCourseSuggestions && courseQuery.trim().length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute z-50 left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-[1.25rem] shadow-2xl p-1.5 space-y-1 max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300/50 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400/50 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-600/50"
                  >
                    {courseSuggestions.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold italic">
                        ✨ No exact matches found.<br/>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">You can submit as a new custom course code!</span>
                      </div>
                    ) : (
                      courseSuggestions.map(item => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => {
                            setCourseCode(item.code);
                            setSelectedCourseName(item.name);
                            setCourseQuery('');
                            setShowCourseSuggestions(false);
                          }}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center gap-3 group/item border border-transparent hover:border-slate-100 dark:hover:border-white/5"
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/15 to-emerald-500/5 text-green-600 dark:text-green-400 shrink-0 shadow-sm border border-green-500/10 group-hover/item:scale-105 transition-transform duration-300">
                            <span role="img" aria-label="course" className="text-lg">📖</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-800 dark:text-white uppercase tracking-wide text-xs">
                                {item.code}
                              </span>
                              <span className="text-[9px] bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider scale-90">
                                Course
                              </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 truncate font-medium text-xs mt-0.5 group-hover/item:text-slate-700 dark:group-hover/item:text-slate-200 transition-colors">
                              {item.name}
                            </p>
                          </div>
                          <div className="opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all duration-300 text-slate-400 dark:text-slate-600 pr-1 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-ewu-green">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                          </div>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Overlay click catcher */}
              {showCourseSuggestions && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowCourseSuggestions(false)}
                />
              )}
            </div>

            {/* Faculty Initials Autocomplete */}
            <div className="space-y-1.5 relative">
              <label className="label-text">Faculty Initials</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="text-slate-400 group-focus-within:text-ewu-green transition-colors w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. MSR"
                  value={facultyInitial}
                  disabled={isUploading}
                  onChange={(e) => {
                    setFacultyInitial(e.target.value);
                    setFacultyQuery(e.target.value);
                    setSelectedFacultyName(''); // Clear selection preview when user types manually
                    setShowFacultySuggestions(true);
                  }}
                  onFocus={() => !isUploading && setShowFacultySuggestions(true)}
                  className="input-field pl-10 h-13 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Selected Faculty Preview Badge */}
              <AnimatePresence>
                {facultyInitial && selectedFacultyName && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mt-2 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold shadow-sm"
                  >
                    <span className="truncate flex items-center gap-1.5 min-w-0">
                      <span role="img" aria-label="teacher" className="shrink-0">👨‍🏫</span>
                      <span className="truncate font-semibold max-w-[180px] md:max-w-[200px]" title={selectedFacultyName}>
                        {selectedFacultyName}
                      </span>
                    </span>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => {
                        setFacultyInitial('');
                        setSelectedFacultyName('');
                        setFacultyQuery('');
                      }}
                      className="p-1 rounded-md hover:bg-blue-500/20 dark:hover:bg-blue-500/30 transition-all text-blue-600 dark:text-blue-400 disabled:opacity-50 shrink-0"
                      title="Clear selection"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {showFacultySuggestions && facultyQuery.trim().length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute z-50 left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-[1.25rem] shadow-2xl p-1.5 space-y-1 max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300/50 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400/50 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-600/50"
                  >
                    {facultySuggestions.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold italic">
                        ✨ No exact matches found.<br/>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">You can submit as new custom faculty initials!</span>
                      </div>
                    ) : (
                      facultySuggestions.map(item => (
                        <button
                          key={item.short_name}
                          type="button"
                          onClick={() => {
                            setFacultyInitial(item.short_name);
                            setSelectedFacultyName(item.full_name);
                            setFacultyQuery('');
                            setShowFacultySuggestions(false);
                          }}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center gap-3 group/item border border-transparent hover:border-slate-100 dark:hover:border-white/5"
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/5 text-blue-600 dark:text-blue-400 shrink-0 shadow-sm border border-blue-500/10 group-hover/item:scale-105 transition-transform duration-300">
                            <span role="img" aria-label="faculty" className="text-lg">👨‍🏫</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-800 dark:text-white uppercase tracking-wide text-xs">
                                {item.short_name}
                              </span>
                              <span className="text-[9px] bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider scale-90">
                                Faculty
                              </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 truncate font-medium text-xs mt-0.5 group-hover/item:text-slate-700 dark:group-hover/item:text-slate-200 transition-colors">
                              {item.full_name || 'No Full Name Available'}
                            </p>
                          </div>
                          <div className="opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all duration-300 text-slate-400 dark:text-slate-600 pr-1 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-blue-500">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                          </div>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Overlay click catcher */}
              {showFacultySuggestions && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowFacultySuggestions(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* File Picker drag & drop */}
        <div className="glass-card rounded-[2.5rem] p-8 border-white/20 shadow-xl space-y-6 relative z-10">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 border-b border-slate-200/50 dark:border-white/5 pb-3">
            📎 Selected Materials
          </h3>

          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 flex flex-col items-center justify-center gap-3 relative group overflow-hidden ${
              isUploading 
                ? 'border-slate-200 dark:border-slate-800/80 bg-slate-50/20 dark:bg-slate-900/20 opacity-50 cursor-not-allowed' 
                : isDragging
                  ? 'border-ewu-green bg-ewu-green/5 dark:bg-ewu-green/10 scale-[1.01] shadow-lg shadow-ewu-green/5'
                  : 'border-slate-200 dark:border-white/5 hover:border-ewu-green dark:hover:border-ewu-green/40 hover:bg-slate-50/50 dark:hover:bg-white/1 cursor-pointer'
            }`}
          >
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl group-hover:scale-110 transition-all duration-300">
              {isUploading ? (
                <div className="w-8 h-8 border-2 border-ewu-green border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500 group-hover:text-ewu-green transition-colors" />
              )}
            </div>
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                {isUploading 
                  ? 'Uploading selected study materials...' 
                  : isDragging
                    ? 'Drop the files here!'
                    : <>Drag & drop files here, or <span className="text-ewu-green hover:underline">browse files</span></>
                }
              </p>
              <p className="text-xs text-slate-400 mt-1 font-semibold">
                {isUploading ? 'Please do not close this tab' : 'Supports: PDF, DOC, DOCX, JPG, PNG (Max 50MB each)'}
              </p>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              disabled={isUploading}
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </div>

          {/* List selected files */}
          <AnimatePresence mode="popLayout">
            {selectedFiles.length > 0 && (
              <div className="space-y-4 pt-2">
                {selectedFiles.map((file, idx) => (
                  <motion.div
                    key={file.name + '-' + file.size}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Name & size info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-white dark:bg-white/5 rounded-xl shrink-0">
                        {getFileIcon(file.name)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 truncate" title={file.name}>
                          {file.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-extrabold mt-0.5">
                          Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    {/* Meta/type configuration and remove */}
                    <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0">
                      <div className="space-y-0.5">
                        <span className="block text-[10px] font-black uppercase text-slate-400 mb-0.5">Doc Type</span>
                        <select
                          value={fileTypes[file.name] || 'Other'}
                          disabled={isUploading}
                          onChange={(e) => handleFileTypeSelect(file.name, e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-ewu-green focus:border-ewu-green disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {FILE_TYPES.map(type => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => removeFile(idx, file.name)}
                        className="p-2.5 bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 hover:text-red-500 rounded-xl transition-all self-end disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove File"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress details if uploading */}
                    {isUploading && uploadProgress[file.name] && (
                      <div className="w-full sm:w-auto flex items-center gap-3 shrink-0 self-center sm:self-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/50 dark:border-white/5">
                        <div className="flex-1 sm:w-24 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-ewu-green h-full transition-all duration-300"
                            style={{ width: `${uploadProgress[file.name].percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-ewu-green">
                          {uploadProgress[file.name].status === 'waiting' && 'Waiting'}
                          {uploadProgress[file.name].status === 'uploading' && `Uploading`}
                          {uploadProgress[file.name].status === 'saving' && 'Saving'}
                          {uploadProgress[file.name].status === 'done' && 'Done!'}
                          {uploadProgress[file.name].status === 'failed' && 'Failed'}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Information box */}
        <div className="p-4 bg-ewu-blue/5 rounded-2xl border border-ewu-blue/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-ewu-blue shrink-0 mt-0.5" />
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium space-y-1">
            <p className="font-extrabold text-ewu-blue">🔒 Content Guidelines & Moderation</p>
            <p>To preserve academic integrity, please double-check that you upload high-quality academic papers or outlines. Your uploads will undergo immediate staff moderation. Once verified by an administrator, your files will be visible publicly, and you will receive a notifications trigger.</p>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isUploading || selectedFiles.length === 0}
          className="btn-primary w-full flex items-center justify-center gap-2.5 h-14 text-base font-bold shadow-xl disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Uploading Materials to Drive...</span>
            </>
          ) : (
            <>
              <span>Submit for Moderation</span>
              <FilePlus className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
