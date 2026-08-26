import {
  AuthSessionPayload,
  StudentDashboardStats,
  CaptainSectionStats,
  AdminOverviewStats,
  AttendanceRecord,
  LeaveRequest,
  User,
  SectionCaptainInfo,
  ApprovalStatus,
  LeaveStatus,
  SystemSettings,
} from '../types';

const API_BASE = '/api';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;

  const local = localStorage.getItem('classhq_token');
  if (local) return local;

  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
    if (match && match[1]) {
      const cookieToken = decodeURIComponent(match[1]);
      // Sync back to localStorage for consistency
      localStorage.setItem('classhq_token', cookieToken);
      return cookieToken;
    }
  }

  return null;
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;

  if (token) {
    localStorage.setItem('classhq_token', token);
    if (typeof document !== 'undefined') {
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=10800; SameSite=Lax`;
    }
  } else {
    localStorage.removeItem('classhq_token');
    if (typeof document !== 'undefined') {
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    }
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    let errorMsg = data?.error;
    if (!errorMsg) {
      if (res.status === 403) {
        errorMsg = 'Account approval is pending verification by your Class Captain or Academic Administrator.';
      } else if (res.status === 401) {
        errorMsg = 'Invalid credentials. Please verify your roll number / email and password.';
      } else if (res.status === 404) {
        errorMsg = 'Requested resource not found.';
      } else {
        errorMsg = `Server request encountered an error (Status ${res.status}).`;
      }
    }
    const err: any = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: any) => request<{ success: boolean; message: string; user: any }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  }),

  login: (emailOrRoll: string, password: string) =>
    request<{ success: boolean; token: string; user: AuthSessionPayload }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrRoll, password }),
    }),

  quickLogin: (role?: string, email?: string) =>
    request<{ success: boolean; token: string; user: AuthSessionPayload }>('/auth/quick-login', {
      method: 'POST',
      body: JSON.stringify({ role, email }),
    }),

  getMe: () => request<{ user: AuthSessionPayload }>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  logout: () =>
    request<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST',
    }),

  // Student
  getStudentStats: (studentId?: string) =>
    request<StudentDashboardStats>(`/student/dashboard-stats${studentId ? `?studentId=${studentId}` : ''}`),

  getStudentAttendance: (studentId?: string) =>
    request<{ records: AttendanceRecord[] }>(`/student/attendance-history${studentId ? `?studentId=${studentId}` : ''}`),

  submitStudentSelfAttendance: (data: { status: 'present' | 'absent'; remarks?: string; date?: string }) =>
    request<{ success: boolean; message: string; record: AttendanceRecord }>('/student/self-attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStudentLeaves: (studentId?: string) =>
    request<{ leaves: LeaveRequest[] }>(`/student/leave-requests${studentId ? `?studentId=${studentId}` : ''}`),

  getStudentCaptainInfo: (batch?: string, section?: string) => {
    const params = new URLSearchParams();
    if (batch) params.append('batch', batch);
    if (section) params.append('section', section);
    return request<{ batch: string; section: string; captains: SectionCaptainInfo[] }>(
      `/student/captain-info?${params.toString()}`
    );
  },

  submitLeaveRequest: (data: {
    leaveType: string;
    date?: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) =>
    request<{ success: boolean; message: string; leave: LeaveRequest }>('/student/leave-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateLeaveRequest: (
    id: string,
    data: {
      leaveType?: string;
      date?: string;
      startDate?: string;
      reason?: string;
    }
  ) =>
    request<{ success: boolean; message: string; leave: LeaveRequest }>(`/student/leave-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Captain
  getCaptainRoster: (date?: string, batch?: string, section?: string) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (batch) params.append('batch', batch);
    if (section) params.append('section', section);
    return request<{
      batch: string;
      section: string;
      date: string;
      totalEnrolled: number;
      roster: Array<{
        studentId: string;
        rollNumber: string;
        fullName: string;
        group: string;
        phoneNumber: string;
        email: string;
        role?: string;
        status: string;
        isMarked: boolean;
        remarks: string;
        studentsNote?: string;
        captainsNote?: string;
      }>;
    }>(`/captain/roster?${params.toString()}`);
  },

  saveCaptainAttendance: (batch: string, section: string, date: string, records: any[]) =>
    request<{ success: boolean; message: string; count: number }>('/captain/attendance', {
      method: 'POST',
      body: JSON.stringify({ batch, section, date, records }),
    }),

  getCaptainSectionLeaves: (batch?: string, section?: string) => {
    const params = new URLSearchParams();
    if (batch) params.append('batch', batch);
    if (section) params.append('section', section);
    return request<{ leaves: LeaveRequest[] }>(`/captain/section-leaves?${params.toString()}`);
  },

  getCaptainSectionStats: (batch?: string, section?: string) => {
    const params = new URLSearchParams();
    if (batch) params.append('batch', batch);
    if (section) params.append('section', section);
    return request<CaptainSectionStats>(`/captain/section-stats?${params.toString()}`);
  },

  // Admin
  getAdminStats: () => request<AdminOverviewStats>('/admin/overview-stats'),

  getAdminStudents: (filters: { batch?: string; section?: string; group?: string; approval?: string; role?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters.batch) params.append('batch', filters.batch);
    if (filters.section) params.append('section', filters.section);
    if (filters.group) params.append('group', filters.group);
    if (filters.approval) params.append('approval', filters.approval);
    if (filters.role) params.append('role', filters.role);
    if (filters.search) params.append('search', filters.search);
    return request<{ total: number; students: User[] }>(`/admin/students?${params.toString()}`);
  },

  updateStudentApproval: (id: string, approval: ApprovalStatus) =>
    request<{ success: boolean; message: string; student: User }>(`/admin/students/${id}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ approval }),
    }),

  updateUserRole: (id: string, role: 'student' | 'captain', assignedBatch?: string, assignedSection?: string) =>
    request<{ success: boolean; message: string; user: User }>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role, assignedBatch, assignedSection }),
    }),

  updateUserSection: (id: string, section: string, batch?: string) =>
    request<{ success: boolean; message: string; user: User }>(`/admin/users/${id}/section`, {
      method: 'PATCH',
      body: JSON.stringify({ section, batch }),
    }),

  getUserProfile: (id: string) =>
    request<{
      success: boolean;
      user: User;
      attendanceStats: StudentDashboardStats;
      attendanceRecords: AttendanceRecord[];
      leaveRequests: LeaveRequest[];
    }>(`/admin/users/${id}/profile`),

  getAdminLeaves: (filters: { status?: string; batch?: string; section?: string }) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.batch) params.append('batch', filters.batch);
    if (filters.section) params.append('section', filters.section);
    return request<{ total: number; leaves: LeaveRequest[] }>(`/admin/leaves?${params.toString()}`);
  },

  reviewLeaveRequest: (id: string, status: LeaveStatus, reviewNote?: string) =>
    request<{ success: boolean; message: string; leave: LeaveRequest }>(`/admin/leaves/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reviewNote }),
    }),

  // Settings
  getSystemSettings: () => request<SystemSettings>('/settings'),
  updateSystemSettings: (data: { startTime: string; endTime: string }) =>
    request<{ success: boolean; message: string; settings: SystemSettings }>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // System
  getSystemStatus: () =>
    request<{
      isConfigured: boolean;
      isConnected: boolean;
      mode: string;
      error: string | null;
      stats: { totalUsers: number; totalAttendanceLogs: number; totalLeaves: number };
    }>('/system/status'),
};
