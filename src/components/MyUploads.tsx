import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { StudyMaterial } from '../types';
import { 
  ArrowLeft, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  Cpu, 
  FileText, 
  Image, 
  FileCode, 
  Layers, 
  Download,
  HelpCircle,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface MyUploadsProps {
  user: any;
}

export const MyUploads: React.FC<MyUploadsProps> = ({ user }) => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyMaterials();
  }, [user]);

  const fetchMyMaterials = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .eq('uploader_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (err: any) {
      console.error('Error fetching personal materials:', err);
      toast.error('Failed to load your uploads');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRemoval = async (id: string) => {
    if (!window.confirm('Are you sure you want to request removal for this study material? An administrator will review and approve your request shortly.')) return;
    
    setActionId(id);
    try {
      const { error } = await supabase
        .from('study_materials')
        .update({ 
          status: 'removal_requested', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Removal request submitted successfully');
      setMaterials(prev => prev.map(m => m.id === id ? { ...m, status: 'removal_requested', updated_at: new Date().toISOString() } : m));
    } catch (err: any) {
      console.error('Error requesting removal:', err);
      toast.error('Failed to submit removal request');
    } finally {
      setActionId(null);
    }
  };

  const getStatusBadge = (status: StudyMaterial['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-black uppercase tracking-wider border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-black uppercase tracking-wider border border-green-500/20">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Active / Approved</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full text-xs font-black uppercase tracking-wider border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      case 'removal_requested':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full text-xs font-black uppercase tracking-wider border border-orange-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Removal Processing</span>
          </span>
        );
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
    return sem.replace(/^(spring|summer|fall)(\d{4})$/i, (_, season, year) => {
      return season.charAt(0).toUpperCase() + season.slice(1).toLowerCase() + ' ' + year;
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 relative">
      {/* Decorative Orbs */}
      <div className="absolute top-[-5%] left-[10%] w-[25rem] h-[25rem] bg-ewu-green/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      
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
            My Uploaded <span className="bg-gradient-to-r from-ewu-green to-green-500 bg-clip-text text-transparent">Materials</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm font-semibold">
            Track validation logs, check moderation status, or request file deletion.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 border-4 border-ewu-green border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-bold tracking-wide uppercase text-xs">Fetching personal history...</p>
        </div>
      ) : materials.length > 0 ? (
        <div className="space-y-6">
          {materials.map((item) => (
            <div
              key={item.id}
              className="glass-card hover:border-ewu-green/30 dark:hover:border-ewu-green/20 rounded-[2rem] p-6 transition-all duration-300 shadow-lg relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              {/* File Info */}
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-white/5 shrink-0 mt-1">
                  {getFileIcon(item.file_name)}
                </div>
                <div className="space-y-2.5 min-w-0">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight leading-snug break-all" title={item.file_name}>
                    {item.file_name}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 bg-ewu-green/10 text-ewu-green dark:text-green-300 rounded text-xs font-black uppercase border border-ewu-green/10">
                      {item.course_code || 'General'}
                    </span>
                    {item.faculty_initial && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 rounded text-xs font-black border border-indigo-500/10">
                        {item.faculty_initial}
                      </span>
                    )}
                    <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded text-xs font-black border border-slate-200/50 dark:border-white/5">
                      {formatSemester(item.semester)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1 font-bold">
                      <Cpu className="w-3.5 h-3.5 text-ewu-green" />
                      {formatBytes(item.file_size_bytes)}
                    </span>
                    <span className="flex items-center gap-1 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-ewu-blue" />
                      Uploaded: {new Date(item.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status pill & Control buttons */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3.5 w-full md:w-auto border-t md:border-t-0 border-slate-200/50 dark:border-white/5 pt-4 md:pt-0 shrink-0">
                <div className="mb-1">{getStatusBadge(item.status)}</div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://drive.google.com/file/d/${item.drive_file_id}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all"
                    title="Open Document"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  {item.status === 'approved' && (
                    <button
                      onClick={() => handleRequestRemoval(item.id)}
                      disabled={actionId === item.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 hover:text-red-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                      title="Request Removal"
                    >
                      {actionId === item.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>Request Removal</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-[2rem] p-10 border-white/20">
          <div className="bg-slate-100 dark:bg-slate-800/80 p-5 rounded-full mb-4">
            <HelpCircle className="w-10 h-10 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="font-bold text-xl text-slate-700 dark:text-slate-200">No Uploads Logged</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2 font-medium text-sm">
            You haven't contributed any files to the EWUmate Study Vault yet. Help your friends by uploading your course question papers or handouts!
          </p>
          <Link
            to="/vault/upload"
            className="btn-primary mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Upload My First File</span>
          </Link>
        </div>
      )}
    </div>
  );
};
