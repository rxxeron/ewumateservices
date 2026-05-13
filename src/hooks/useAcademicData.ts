import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAcademicData = (userId: string | undefined) => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [activeSemester, setActiveSemester] = useState<string>('Summer 2026');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch programs
        const { data: progData } = await supabase
          .from('programs')
          .select('*');
        
        let track = 'tri_semester';
        let userProgram: any = null;

        if (progData && progData.length > 0) {
          setPrograms(progData);
          const depts = Array.from(new Set(progData
            .map(p => p.department_name)
            .filter(d => d)
            .map(d => d.startsWith('Department of') ? d : `Department of ${d}`)
          )).sort() as string[];
          setDepartments(depts);

          // Find user's track if userId is provided
          if (userId) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('program_code')
              .eq('id', userId)
              .single();
            
            if (profile?.program_code) {
              const pCode = profile.program_code.toUpperCase();
              userProgram = progData.find(p => p.program_code.toUpperCase() === pCode);
              // Pharmacy usually uses bi_semester track
              if (pCode.includes('PHRM') || pCode.includes('PHAR') || (userProgram?.name || '').toLowerCase().includes('pharmacy')) {
                track = 'bi_semester';
              }
            }
          }
        }

        // Fetch active semester based on track
        const { data: semData } = await supabase
          .from('active_semester')
          .select('current_semester_code')
          .eq('track', track)
          .maybeSingle();

        if (semData?.current_semester_code) {
          // Format 'Summer2026' -> 'Summer 2026'
          const formatted = semData.current_semester_code.replace(/(\d+)/, ' $1');
          setActiveSemester(formatted);
        }

        // Fetch enrollments for current semester
        if (userId) {
          const currentSem = semData?.current_semester_code || 'Summer2026';

          const { data: enrollData } = await supabase
            .from('enrollments')
            .select('course_code, section')
            .eq('user_id', userId)
            .eq('semester_code', currentSem.replace(/\s/g, ''));
          
          if (enrollData) setEnrollments(enrollData);
        }
      } catch (error) {
        console.error('Error fetching academic data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return { programs, departments, enrollments, activeSemester, loading };
};
