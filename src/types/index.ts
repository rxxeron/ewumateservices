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
