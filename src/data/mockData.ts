import type { ClassSession, RoutineMetadata, AdminStats } from '../types';

export const METADATA: RoutineMetadata = {
  lastUpdated: '2026-09-30T14:30:00Z',
  activeSemester: 'Fall 2026',
};

export const ADMIN_STATS: AdminStats = {
  activeRoutine: 'Fall 2026 (v1.2)',
  totalBatches: 12,
  totalSections: 36,
  totalClasses: 245,
  lastUpdated: '2026-09-30 02:30 PM',
};

export const MOCK_CLASSES: ClassSession[] = [
  {
    id: '1',
    batch: '20',
    section: 'A',
    semester: 'Fall 2026',
    day: 'Wednesday', // Today's date mock
    startTime: '09:00 AM',
    endTime: '10:30 AM',
    courseCode: 'CIS-412',
    courseName: 'Artificial Intelligence',
    teacher: 'Dr. XYZ',
    room: 'AB4-502',
    status: 'Scheduled',
  },
  {
    id: '2',
    batch: '20',
    section: 'A',
    semester: 'Fall 2026',
    day: 'Wednesday',
    startTime: '11:00 AM',
    endTime: '12:30 PM',
    courseCode: 'CIS-301',
    courseName: 'Database Management',
    teacher: 'ABC Sir',
    room: 'AB4-503',
    status: 'Scheduled',
  },
  {
    id: '3',
    batch: '20',
    section: 'A',
    semester: 'Fall 2026',
    day: 'Wednesday',
    startTime: '02:00 PM',
    endTime: '03:30 PM',
    courseCode: 'CIS-302',
    courseName: 'Software Engineering',
    teacher: 'DEF Sir',
    room: 'AB5-301',
    status: 'Scheduled',
  },
  {
    id: '4',
    batch: '20',
    section: 'A',
    semester: 'Fall 2026',
    day: 'Thursday',
    startTime: '10:00 AM',
    endTime: '11:30 AM',
    courseCode: 'CIS-305',
    courseName: 'Web Technologies',
    teacher: 'MNO Maam',
    room: 'AB4-402',
    status: 'Scheduled',
  },
];

export const BATCHES = ['19', '20', '21', '22'];
export const SECTIONS = ['A', 'B', 'C', 'D'];
export const SEMESTERS = ['Fall 2026', 'Spring 2026'];
