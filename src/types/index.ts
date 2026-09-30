export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface ClassSession {
  id: string;
  batch: string;
  section: string;
  semester: string;
  day: DayOfWeek;
  startTime: string; // "09:00 AM"
  endTime: string;   // "10:30 AM"
  courseCode: string;
  courseName: string;
  teacher: string;
  room: string;
  status: 'Scheduled' | 'Cancelled' | 'Rescheduled';
}

export interface RoutineMetadata {
  lastUpdated: string;
  activeSemester: string;
}

export interface AdminStats {
  activeRoutine: string;
  totalBatches: number;
  totalSections: number;
  totalClasses: number;
  lastUpdated: string;
}
