import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAcademicData } from '../hooks/useAcademicData';
import type { Student, CoverPageData } from '../types';
import { FileText, Users, GraduationCap, Plus, Trash2, Download, Loader2 } from 'lucide-react';
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
  const { programs, departments, enrollments, activeSemester, loading } = useAcademicData(user?.id);
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
    <div className="max-w-4xl mx-auto py-8 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-6 md:p-10 shadow-xl"
      >
        <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
          <div className="bg-ewu-blue p-3 rounded-2xl shadow-lg">
            <FileText className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Cover Page Generator</h1>
            <p className="text-slate-500">Create professional university cover pages in seconds</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section 1: Template & Basics */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-ewu-blue font-semibold">
              <FileText className="w-5 h-5" />
              <span>General Information</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="label-text">Template Format</label>
                <select 
                  className="input-field"
                  value={formData.template}
                  onChange={(e) => handleInputChange('template', e.target.value)}
                >
                  {TEMPLATES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="label-text flex items-center justify-between">
                  <span>Academic Semester</span>
                  {loading && <Loader2 className="w-3 h-3 animate-spin text-ewu-blue" />}
                </label>
                <input 
                  className="input-field"
                  placeholder={loading ? 'Detecting...' : 'Summer 2026'}
                  value={formData.semester}
                  onChange={(e) => handleInputChange('semester', e.target.value)}
                />
              </div>

              <div>
                <label className="label-text">Header Department</label>
                <select 
                  className="input-field"
                  value={formData.header_dept}
                  onChange={(e) => handleInputChange('header_dept', e.target.value)}
                >
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {['lab_report', 'physics_lab'].includes(formData.template) && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="label-text">Exp No</label>
                    <input 
                      className="input-field"
                      placeholder="01"
                      value={formData.lab_no}
                      onChange={(e) => handleInputChange('lab_no', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="label-text">Experiment Name</label>
                    <input 
                      className="input-field"
                      placeholder="Speed of Sound"
                      value={formData.topic}
                      onChange={(e) => handleInputChange('topic', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {['assignment', 'mps_assignment', 'group_project', 'term_paper'].includes(formData.template) && (
                <div>
                  <label className="label-text">Topic / Title</label>
                  <input 
                    className="input-field"
                    placeholder="Impact of AI on Society"
                    value={formData.topic}
                    onChange={(e) => handleInputChange('topic', e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Course & Faculty */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-ewu-blue font-semibold">
              <GraduationCap className="w-5 h-5" />
              <span>Course & Instructor</span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="label-text">Course Code</label>
                  <input 
                    list="enrollments"
                    className="input-field"
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
                <div>
                  <label className="label-text">Section</label>
                  <input 
                    className="input-field"
                    placeholder="1"
                    value={formData.section}
                    onChange={(e) => {
                      handleInputChange('section', e.target.value);
                      if (formData.course_code) fetchFacultyDetails(formData.course_code, e.target.value);
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Course Title</label>
                <input 
                  className="input-field"
                  placeholder="Structured Programming"
                  value={formData.course_title}
                  onChange={(e) => handleInputChange('course_title', e.target.value)}
                />
              </div>

              <div>
                <label className="label-text">Instructor Name</label>
                <input 
                  className="input-field"
                  placeholder="Dr. John Doe"
                  value={formData.teacher_name}
                  onChange={(e) => handleInputChange('teacher_name', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Designation</label>
                  <select 
                    className="input-field"
                    value={formData.designation}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                  >
                    {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-text">Faculty Dept</label>
                  <select 
                    className="input-field"
                    value={formData.teacher_dept}
                    onChange={(e) => handleInputChange('teacher_dept', e.target.value)}
                  >
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Student Information */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between border-t border-slate-100 pt-8">
            <div className="flex items-center gap-2 text-ewu-blue font-semibold">
              <Users className="w-5 h-5" />
              <span>Student Information</span>
            </div>
            {['group_project', 'term_paper', 'mps_assignment'].includes(formData.template) && (
              <button 
                onClick={addStudent}
                className="flex items-center gap-2 text-sm bg-ewu-lightBlue text-ewu-blue px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {formData.students.map((student, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-5 border border-slate-200 rounded-2xl relative bg-white/50"
                >
                  {index > 0 && (
                    <button 
                      onClick={() => removeStudent(index)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                    {index === 0 ? 'Primary Student' : `Group Member ${index + 1}`}
                  </div>

                  <div className="space-y-3">
                    <input 
                      className="input-field"
                      placeholder="Full Name"
                      value={student.name}
                      onChange={(e) => handleStudentChange(index, 'name', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        className="input-field"
                        placeholder="ID"
                        value={student.id}
                        onChange={(e) => handleStudentChange(index, 'id', e.target.value)}
                      />
                      <input 
                        list={`program-list-${index}`}
                        className="input-field"
                        placeholder="Code (CSE)"
                        value={student.program_code}
                        onChange={(e) => handleStudentChange(index, 'program_code', e.target.value)}
                      />
                      <datalist id={`program-list-${index}`}>
                        {programs.map(p => (
                          <option key={p.program_code} value={p.program_code}>
                            {p.name}
                          </option>
                        ))}
                      </datalist>
                    </div>
                    <input 
                      className="input-field text-xs"
                      placeholder="Full Program Name"
                      value={student.program}
                      onChange={(e) => handleStudentChange(index, 'program', e.target.value)}
                    />
                    <input 
                      className="input-field text-xs"
                      placeholder="Student Department"
                      value={student.dept}
                      onChange={(e) => handleStudentChange(index, 'dept', e.target.value)}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Section 4: Dates & Submit */}
        <div className="mt-12 pt-8 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">Allocation Date</label>
                <input 
                  type="date"
                  className="input-field"
                  value={formData.allocation_date}
                  onChange={(e) => handleInputChange('allocation_date', e.target.value)}
                />
              </div>
              <div>
                <label className="label-text">Submission Date</label>
                <input 
                  type="date"
                  className="input-field"
                  value={formData.submission_date}
                  onChange={(e) => handleInputChange('submission_date', e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={generatePDF}
              disabled={generating}
              className="btn-primary flex items-center justify-center gap-3 h-14"
            >
              {generating ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Download className="w-6 h-6" />
              )}
              {generating ? 'Processing...' : 'Generate PDF Report'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
