export interface Student {
  name: string;
  id: string;
  program: string;
  program_code: string;
  dept: string;
}

export interface CoverPageData {
  template: string;
  semester: string;
  topic: string;
  group_no: string;
  lab_no: string;
  header_dept: string;
  course_title: string;
  course_code: string;
  section: string;
  teacher_name: string;
  designation: string;
  teacher_dept: string;
  allocation_date: string;
  submission_date: string;
  students: Student[];
}

export interface StudyMaterial {
  id: string;
  uploader_id: string | null;
  faculty_initial: string | null;
  course_code: string | null;
  semester: string | null;
  file_type: string | null;
  drive_account_id: string | null;
  drive_file_id: string;
  file_name: string;
  file_size_bytes: number;
  created_at: string;
  updated_at: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'removal_requested';
  profiles?: {
    full_name: string | null;
    student_id: string | null;
  };
}

