import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAcademicData } from '../hooks/useAcademicData';
import type { Student, CoverPageData } from '../types';
import { FileText, Users, GraduationCap, Plus, Trash2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const TEMPLATES = [
  { value: 'assignment', label: 'Assignment' },
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'physics_lab', label: 'Physics Lab' },
  { value: 'group_project', label: 'Group Project' },
  { value: 'term_paper', label: 'Term Paper' },
  { value: 'mps_assignment', label: 'Group Assignment' },
];

const DESIGNATIONS = [
  'Lecturer',
  'Senior Lecturer',
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'Adjunct Faculty',
];

export const CoverPageForm: React.FC<{ user: any }> = ({ user }) => {
  const { programs, departments, enrollments, activeSemester } = useAcademicData(user?.id);
  const [generating, setGenerating] = useState(false);
  
  const [formData, setFormData] = useState<CoverPageData>({
    template: 'assignment',
    semester: 'Summer 2026',
    topic: '',
    group_no: '',
    lab_no: '',
    header_dept: 'Department of CSE',
    course_title: '',
    course_code: '',
    section: '',
    teacher_name: '',
    designation: 'Lecturer',
    teacher_dept: 'Department of CSE',
    allocation_date: '',
    submission_date: new Date().toISOString().split('T')[0],
    students: [{ name: '', id: '', program: '', program_code: '', dept: '' }]
  });

  // Sync semester from activeSemester when it loads
  useEffect(() => {
    if (activeSemester) {
      setFormData(prev => ({ ...prev, semester: activeSemester }));
    }
  }, [activeSemester]);

  // Initialize primary student from profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          const pCode = profile.program_code || '';
          const program = programs.find(p => p.program_code.toUpperCase() === pCode.toUpperCase());
          const dept = program?.department_name || profile.department_name || '';
          const formattedDept = dept.startsWith('Department of') ? dept : `Department of ${dept}`;

          setFormData(prev => ({
            ...prev,
            header_dept: formattedDept || prev.header_dept,
            teacher_dept: formattedDept || prev.teacher_dept,
            students: [{
              name: profile.full_name || '',
              id: profile.student_id || '',
              program_code: pCode,
              program: program?.name || profile.program_name || '',
              dept: formattedDept
            }]
          }));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    if (user && programs.length > 0) fetchProfile();
  }, [user, programs]);

  const handleInputChange = (field: keyof CoverPageData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Sync departments
      if (field === 'header_dept') newData.teacher_dept = value;
      if (field === 'teacher_dept') newData.header_dept = value;
      return newData;
    });
  };

  const handleStudentChange = (index: number, field: keyof Student, value: string) => {
    const formattedValue = field === 'program_code' ? value.toUpperCase() : value;
    const newStudents = [...formData.students];
    newStudents[index] = { ...newStudents[index], [field]: formattedValue };
    
    // Auto-fill program name and dept if code is entered
    if (field === 'program_code' && formattedValue.length >= 2) {
      const prog = programs.find(p => p.program_code.toUpperCase() === formattedValue.toUpperCase());
      if (prog) {
        newStudents[index].program = prog.name;
        newStudents[index].dept = prog.department_name.startsWith('Department of') 
          ? prog.department_name 
          : `Department of ${prog.department_name}`;
      }
    }
    
    setFormData(prev => ({ ...prev, students: newStudents }));
  };

  const addStudent = () => {
    if (formData.students.length < 4) {
      setFormData(prev => ({
        ...prev,
        students: [...prev.students, { name: '', id: '', program_code: '', program: '', dept: '' }]
      }));
    } else {
      toast.error('Maximum 4 students allowed');
    }
  };

  const removeStudent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      students: prev.students.filter((_, i) => i !== index)
    }));
  };

  const fetchFacultyDetails = async (code: string, section: string) => {
    try {
      const currentSem = formData.semester.replace(/\s/g, '').toLowerCase();
      const { data } = await supabase
        .from(`courses_${currentSem}`)
        .select('course_name, faculty_full_name, faculty_designation')
        .eq('course_code', code)
        .eq('section_number', section)
        .maybeSingle();

      if (data) {
        setFormData(prev => ({
          ...prev,
          course_title: data.course_name,
          teacher_name: data.faculty_full_name,
          designation: DESIGNATIONS.includes(data.faculty_designation) ? data.faculty_designation : prev.designation
        }));
      }
    } catch (e) {
      console.error('Error fetching faculty:', e);
    }
  };

  const generatePDF = async () => {
    if (!formData.course_code || !formData.teacher_name || !formData.students[0].name) {
      toast.error('Please fill in required fields');
      return;
    }

    setGenerating(true);
    const toastId = toast.loading('Generating your PDF...');

    try {
      console.log('[DEBUG] Sending PDF Payload:', formData);
      const response = await fetch('https://ewumate-parser.azurewebsites.net/api/generate_pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-functions-key': import.meta.env.VITE_AZURE_FUNCTION_KEY
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CoverPage_${formData.course_code}_${formData.template}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF generated successfully!', { id: toastId });
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-800 dark:text-white">
              Cover Page <span className="text-ewu-green">Generator</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Professional academic reports in seconds</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/5 shadow-lg">
            <div className="w-2 h-2 bg-ewu-green rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-ewu-green uppercase tracking-widest">{activeSemester || 'Summer 2026'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Section 1: Template & Basics */}
          <div className="glass-card rounded-[2.5rem] p-7 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-ewu-blue/10 p-2 rounded-xl">
                <FileText className="text-ewu-blue dark:text-blue-400 w-6 h-6" />
              </div>
              <h2 className="text-lg font-black dark:text-white tracking-tight">General Info</h2>
            </div>
            
            <div className="space-y-4 flex-grow">
              <div className="space-y-1 relative group">
                <label className="label-text !text-[11px]">Template Format</label>
                <select 
                  className="input-field !py-2.5 appearance-none pr-10 cursor-pointer text-sm"
                  value={formData.template}
                  onChange={(e) => handleInputChange('template', e.target.value)}
                >
                  {TEMPLATES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <div className="absolute right-4 bottom-3 pointer-events-none text-slate-400 group-focus-within:text-ewu-green transition-colors">
                  <Plus className="w-3.5 h-3.5 rotate-45" />
                </div>
              </div>

              <div className="space-y-1 relative group">
                <label className="label-text !text-[11px]">Header Department</label>
                <select 
                  className="input-field !py-2.5 appearance-none pr-10 cursor-pointer text-sm"
                  value={formData.header_dept}
                  onChange={(e) => handleInputChange('header_dept', e.target.value)}
                >
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <div className="absolute right-4 bottom-3 pointer-events-none text-slate-400 group-focus-within:text-ewu-green transition-colors">
                  <Plus className="w-3.5 h-3.5 rotate-45" />
                </div>
              </div>

              <div className="space-y-1">
                {['lab_report', 'physics_lab'].includes(formData.template) ? (
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-1 space-y-1">
                      <label className="label-text !text-[11px]">Exp No</label>
                      <input 
                        className="input-field !py-2.5 text-sm"
                        placeholder="01"
                        value={formData.lab_no}
                        onChange={(e) => handleInputChange('lab_no', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <label className="label-text !text-[11px]">Experiment Name</label>
                      <input 
                        className="input-field !py-2.5 text-sm"
                        placeholder="Speed of Sound"
                        value={formData.topic}
                        onChange={(e) => handleInputChange('topic', e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="label-text !text-[11px]">Topic / Title</label>
                    <input 
                      className="input-field !py-2.5 text-sm"
                      placeholder="Impact of AI on Society"
                      value={formData.topic}
                      onChange={(e) => handleInputChange('topic', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Course & Instructor */}
          <div className="glass-card rounded-[2.5rem] p-7 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-ewu-green/10 p-2 rounded-xl">
                <GraduationCap className="text-ewu-green w-6 h-6" />
              </div>
              <h2 className="text-lg font-black dark:text-white tracking-tight">Course & Faculty</h2>
            </div>

            <div className="space-y-4 flex-grow">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="label-text !text-[11px]">Course Code</label>
                  <input 
                    list="enrollments"
                    className="input-field !py-2.5 font-mono uppercase tracking-wider text-sm"
                    placeholder="CSE101"
                    value={formData.course_code}
                    onChange={(e) => {
                      const code = e.target.value.toUpperCase();
                      handleInputChange('course_code', code);
                      const enrollment = enrollments.find(en => en.course_code === code);
                      if (enrollment) {
                        handleInputChange('section', enrollment.section);
                        fetchFacultyDetails(code, enrollment.section);
                      }
                    }}
                  />
                  <datalist id="enrollments">
                    {enrollments.map(en => <option key={en.course_code} value={en.course_code} />)}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="label-text !text-[11px]">Section</label>
                  <input 
                    className="input-field !py-2.5 text-center text-sm"
                    placeholder="1"
                    value={formData.section}
                    onChange={(e) => {
                      handleInputChange('section', e.target.value);
                      if (formData.course_code) fetchFacultyDetails(formData.course_code, e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="label-text !text-[11px]">Course Title</label>
                <input 
                  className="input-field !py-2.5 text-sm"
                  placeholder="Structured Programming"
                  value={formData.course_title}
                  onChange={(e) => handleInputChange('course_title', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="label-text !text-[11px]">Instructor Name</label>
                <input 
                  className="input-field !py-2.5 font-bold text-sm"
                  placeholder="Dr. John Doe"
                  value={formData.teacher_name}
                  onChange={(e) => handleInputChange('teacher_name', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 relative group">
                  <label className="label-text !text-[11px]">Designation</label>
                  <select 
                    className="input-field !py-2.5 appearance-none pr-10 cursor-pointer text-xs"
                    value={formData.designation}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                  >
                    {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <div className="absolute right-4 bottom-3 pointer-events-none text-slate-400 group-focus-within:text-ewu-green transition-colors">
                    <Plus className="w-3 h-3 rotate-45" />
                  </div>
                </div>

                <div className="space-y-1 relative group">
                  <label className="label-text !text-[11px]">Faculty Dept</label>
                  <select 
                    className="input-field !py-2.5 appearance-none pr-10 cursor-pointer text-xs"
                    value={formData.teacher_dept}
                    onChange={(e) => handleInputChange('teacher_dept', e.target.value)}
                  >
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <div className="absolute right-4 bottom-3 pointer-events-none text-slate-400 group-focus-within:text-ewu-green transition-colors">
                    <Plus className="w-3 h-3 rotate-45" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Submission & Pro Tips */}
          <div className="space-y-6">
            <div className="glass-card rounded-[2.5rem] p-7 border-ewu-green/20">
              <h3 className="text-lg font-black dark:text-white mb-6 tracking-tight">Submission</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <label className="label-text !text-[11px]">Allocation</label>
                  <input 
                    type="date"
                    className="input-field !py-2 text-xs"
                    value={formData.allocation_date}
                    onChange={(e) => handleInputChange('allocation_date', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="label-text !text-[11px]">Submission</label>
                  <input 
                    type="date"
                    className="input-field !py-2 text-xs"
                    value={formData.submission_date}
                    onChange={(e) => handleInputChange('submission_date', e.target.value)}
                  />
                </div>
              </div>

              <button 
                onClick={generatePDF}
                disabled={generating}
                className="btn-primary w-full flex items-center justify-center gap-3 h-16 text-lg rounded-2xl"
              >
                {generating ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="font-black uppercase tracking-widest text-base">Generate PDF</span>
                    <Download className="w-6 h-6" />
                  </>
                )}
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-7 text-slate-600 dark:text-slate-300 shadow-xl border border-slate-200 dark:border-white/5 relative overflow-hidden group">
              <h4 className="text-sm font-black mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
                <div className="w-1.5 h-6 bg-ewu-green rounded-full"></div>
                Quick Tips
              </h4>
              <ul className="space-y-3 text-[11px] font-medium">
                <li className="flex gap-3">
                  <span className="text-ewu-green font-black">01</span>
                  <p>Enter <span className="text-slate-900 dark:text-white font-bold">Course Code</span> to auto-fill Instructor.</p>
                </li>
                <li className="flex gap-3">
                  <span className="text-ewu-green font-black">02</span>
                  <p>Use <span className="text-slate-900 dark:text-white font-bold">Program Code</span> (CSE) for lookup.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 4: Student Information */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-xl shadow-lg shadow-blue-500/5">
                <Users className="text-blue-500 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Student Information</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em]">Manage Contributors</p>
              </div>
            </div>
            {['group_project', 'term_paper', 'mps_assignment'].includes(formData.template) && (
              <button 
                onClick={addStudent}
                className="flex items-center gap-2 bg-ewu-blue hover:bg-slate-800 text-white px-6 py-2.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-xl shadow-ewu-blue/20"
              >
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {formData.students.map((student, index) => (
                <motion.div 
                  key={index}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card rounded-[2rem] p-6 relative group overflow-hidden border-white/40"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="inline-flex items-center px-3 py-1 bg-ewu-green text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-ewu-green/20">
                      {index === 0 ? 'Lead Student' : `Member ${index + 1}`}
                    </div>
                    {index > 0 && (
                      <button 
                        onClick={() => removeStudent(index)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        className="input-field !py-2 text-xs font-bold"
                        placeholder="Full Name"
                        value={student.name}
                        onChange={(e) => handleStudentChange(index, 'name', e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Student ID</label>
                        <input 
                          className="input-field !py-2 text-xs font-mono"
                          placeholder="ID"
                          value={student.id}
                          onChange={(e) => handleStudentChange(index, 'id', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1 relative group">
                        <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Prog Code</label>
                        <select 
                          className="input-field !py-2 text-xs font-mono appearance-none pr-8 cursor-pointer"
                          value={student.program_code}
                          onChange={(e) => handleStudentChange(index, 'program_code', e.target.value)}
                        >
                          <option value="">Code</option>
                          {programs.map(p => (
                            <option key={p.program_code} value={p.program_code}>{p.program_code}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 bottom-2 pointer-events-none text-slate-400 group-focus-within:text-ewu-green transition-colors">
                          <Plus className="w-3 h-3 rotate-45" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Program</label>
                        <input 
                          className="input-field !py-2 text-[10px] font-medium"
                          placeholder="Program"
                          value={student.program}
                          onChange={(e) => handleStudentChange(index, 'program', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Dept</label>
                        <input 
                          className="input-field !py-2 text-[10px] font-medium"
                          placeholder="Dept"
                          value={student.dept}
                          onChange={(e) => handleStudentChange(index, 'dept', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
