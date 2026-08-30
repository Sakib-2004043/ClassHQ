export type UserRole = 'student' | 'captain' | 'admin';
export type Gender = 'Male' | 'Female';
export type HSCBatch =
  | 'HSC 2024'
  | 'HSC 2025'
  | 'HSC 2026'
  | 'HSC 2027'
  | 'HSC 2028'
  | 'HSC 2029'
  | 'HSC 2030';
export type AcademicGroup = 'Science' | 'Arts' | 'Commerce';
export type Section = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'leave'
  | 'fraud'
  | 'late'
  | 'Present'
  | 'Absent'
  | 'Leave'
  | 'Fraud'
  | 'Late';
export type LeaveType = 'Medical' | 'Casual' | 'Emergency' | 'Academic' | 'Family' | 'Others';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface User {
  id: string;
  fullName: string;
  rollNumber: string;
  email: string;
  phoneNumber: string;
  gender: Gender;
  batch: HSCBatch;
  group: AcademicGroup;
  section: Section;
  address: string;
  role: UserRole;
  approval: ApprovalStatus;
  password?: string;
  assignedBatch?: HSCBatch;
  assignedSection?: Section;
  createdAt: string;
}

export interface SectionCaptainInfo {
  id: string;
  fullName: string;
  rollNumber: string;
  email: string;
  phoneNumber?: string;
  assignedBatch: HSCBatch;
  assignedSection: Section;
  group?: AcademicGroup;
  gender?: Gender;
}

export interface AuthSessionPayload {
  userId: string;
  id?: string;
  email: string;
  role: UserRole;
  fullName: string;
  rollNumber: string;
  batch: HSCBatch;
  section: Section;
  group: AcademicGroup;
  approval: ApprovalStatus;
  gender?: Gender;
  phoneNumber?: string;
  address?: string;
  assignedBatch?: HSCBatch;
  assignedSection?: Section;
  createdAt?: string;
  exp?: number;
}

export interface AttendanceRecord {
  id: string;
  email: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  studentsNote?: string;
  captainsNote?: string;
  leaveType?: LeaveType | string;
  leaveReason?: string;
  leaveStatus?: LeaveStatus | 'None';
  studentId?: string;
  studentRoll?: string;
  studentName?: string;
  batch?: HSCBatch;
  section?: Section;
  group?: AcademicGroup;
  reviewedBy?: {
    id: string;
    email?: string;
    name: string;
    role: UserRole;
  };
  reviewedAt?: string;
  submittedAt?: string;
  markedBy?: {
    id: string;
    name: string;
    role: UserRole;
  };
  remarks?: string;
  timestamp?: string;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentRoll: string;
  studentName: string;
  studentEmail: string;
  studentRole?: UserRole;
  batch: HSCBatch;
  section: Section;
  group: AcademicGroup;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  reason: string;
  leaveReason?: string;
  studentsNote?: string;
  captainsNote?: string;
  status: LeaveStatus;
  reviewedBy?: {
    id: string;
    email?: string;
    name: string;
    role: UserRole;
  };
  reviewNote?: string;
  reviewedAt?: string;
  submittedAt: string;
}

export interface StudentDashboardStats {
  attendancePercentage: number;
  totalDays: number;
  daysPresent: number;
  daysAbsent: number;
  daysLeave: number;
  daysFraud?: number;
  daysLate?: number;
  daysExcused?: number;
  totalLeaveRequests: number;
  pendingLeaves: number;
  approvedLeaves: number;
  isWarning: boolean;
}

export interface CaptainSectionStats {
  section: Section;
  batch: HSCBatch;
  totalStudents: number;
  todayPresent: number;
  todayAbsent: number;
  todayLeave: number;
  todayLate?: number;
  todayExcused?: number;
  todayMarked: boolean;
  pendingLeaves: number;
}

export interface AdminOverviewStats {
  totalStudents: number;
  totalCaptains: number;
  captainsCount?: number;
  pendingStudentApprovals: number;
  pendingLeaveApprovals: number;
  totalLeavesRecorded: number;
  todayInstitutionAttendanceRate: number;
  batchesCount: number;
  sectionsCount: number;
  sectionAttendanceBreakdown?: Array<{
    batch: HSCBatch;
    section: Section;
    totalStudents: number;
    attendanceRate: number;
  }>;
  lowAttendanceStudents?: Array<{
    studentId: string;
    rollNumber: string;
    fullName: string;
    batch: HSCBatch;
    section: Section;
    attendancePercentage: number;
    presentDays: number;
    totalClasses: number;
  }>;
  dailyTrend?: Array<{
    date: string;
    formattedDate: string;
    rate: number;
    present: number;
    absent: number;
    late: number;
    total: number;
  }>;
  statusDistribution?: Array<{
    name: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  batchBreakdown?: Array<{
    batch: string;
    totalStudents: number;
    approvedStudents: number;
    captainsCount: number;
    attendanceRate: number;
  }>;
  groupBreakdown?: Array<{
    group: string;
    totalStudents: number;
    attendanceRate: number;
  }>;
  complianceTiers?: Array<{
    tier: string;
    range: string;
    count: number;
    percentage: number;
    color: string;
  }>;
}

export interface UserProfileDetail {
  user: User;
  attendanceStats: StudentDashboardStats;
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
}

export interface SystemSettings {
  key: string;
  startTime: string;
  endTime: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface Holiday {
  id: string;
  title: string;
  batch: HSCBatch;
  section: Section;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  description?: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    rollNumber?: string;
    role: UserRole;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceEditOverride {
  id: string;
  captainId: string;
  captainName: string;
  captainEmail: string;
  captainRoll?: string;
  batch: HSCBatch;
  section: Section;
  targetDate: string; // YYYY-MM-DD
  durationMinutes: number;
  grantedAt: string; // ISO date
  expiresAt: string; // ISO date
  grantedBy: {
    id: string;
    name: string;
    email: string;
    role?: UserRole;
  };
  reason?: string;
  status: 'active' | 'expired' | 'revoked';
  createdAt: string;
  updatedAt?: string;
}

export interface CaptainEditPermissionStatus {
  allowed: boolean;
  reason: string;
  isSameDay: boolean;
  isWithinTimeWindow: boolean;
  activeOverride: AttendanceEditOverride | null;
  activeGrants?: AttendanceEditOverride[];
  serverTime: string;
  serverDate: string;
  timeWindow: {
    start: string; // e.g. "12:05 AM"
    end: string;   // e.g. "11:55 PM"
  };
  remainingSeconds?: number;
}
