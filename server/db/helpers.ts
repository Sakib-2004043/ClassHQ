import { User, AttendanceRecord, AttendanceStatus, LeaveRequest, LeaveStatus, LeaveType } from '../../src/types.ts';

export function normalizeBatch(batch?: string | null): string {
  if (!batch) return '';
  const str = String(batch).trim();
  const digits = str.match(/\d+/);
  if (digits) {
    return digits[0]; // e.g. '2026' from '2026' or 'HSC 2026'
  }
  return str.toUpperCase();
}

export function normalizeSection(section?: string | null): string {
  if (!section) return '';
  let str = String(section).trim().toUpperCase();
  str = str.replace(/^(SECTION|SEC)\s+/i, '').trim();
  return str;
}

export function compareBatch(b1?: string | null, b2?: string | null): boolean {
  if (!b1 || !b2) return false;
  return normalizeBatch(b1) === normalizeBatch(b2);
}

export function compareSection(s1?: string | null, s2?: string | null): boolean {
  if (!s1 || !s2) return false;
  return normalizeSection(s1) === normalizeSection(s2);
}

export function formatUserDoc(doc: any): User {
  if (!doc) return doc;

  const id = doc.id || (doc._id ? doc._id.toString() : doc.userId || doc.roll || doc.rollNumber || '');
  const fullName = doc.fullName || doc.name || 'Student';
  const rollNumber = doc.rollNumber || doc.roll || doc.rollNo || id || '';
  const email = (doc.email || '').trim().toLowerCase();
  const phoneNumber = doc.phoneNumber || doc.phone || '';

  // Batch handling
  const rawBatch = doc.batch || doc.assignedBatch || doc.hscBatch || '2026';
  const batchDigits = String(rawBatch).match(/\d+/);
  const formattedBatch = batchDigits ? `HSC ${batchDigits[0]}` : String(rawBatch).trim();

  // Section handling
  const rawSection = doc.section || doc.assignedSection || 'A';
  const cleanSection = normalizeSection(String(rawSection));

  const role = doc.role || 'student';

  const assignedBatchRaw = doc.assignedBatch || doc.hscBatch || doc.batch || formattedBatch;
  const assignedBatchDigits = String(assignedBatchRaw).match(/\d+/);
  const formattedAssignedBatch = assignedBatchDigits ? `HSC ${assignedBatchDigits[0]}` : String(assignedBatchRaw).trim();

  const assignedSectionRaw = doc.assignedSection || doc.section || cleanSection;
  const formattedAssignedSection = normalizeSection(String(assignedSectionRaw));

  return {
    ...doc,
    id,
    fullName,
    rollNumber,
    email,
    phoneNumber,
    batch: formattedBatch,
    section: cleanSection,
    assignedBatch: role === 'captain' ? formattedAssignedBatch : (doc.assignedBatch ? `HSC ${normalizeBatch(doc.assignedBatch)}` : undefined),
    assignedSection: role === 'captain' ? formattedAssignedSection : (doc.assignedSection ? normalizeSection(doc.assignedSection) : undefined),
    group: doc.group || 'Science',
    gender: doc.gender || 'Male',
    role,
    approval: doc.approval || 'pending',
    address: doc.address || '',
  };
}

/**
 * Hydrates attendance document using User entity via Foreign Key (email)
 */
export function formatAttendanceDoc(doc: any, user?: User | null): AttendanceRecord {
  if (!doc) return doc;
  const rawStatus = (doc.status || 'absent').toString().toLowerCase();
  let status: AttendanceStatus = 'absent';
  if (rawStatus === 'present') {
    status = 'present';
  } else if (rawStatus === 'fraud') {
    status = 'fraud';
  } else if (rawStatus === 'leave' || rawStatus === 'excused' || rawStatus === 'late') {
    if (doc.leaveStatus === 'Pending' || doc.leaveStatus === 'Rejected') {
      status = 'absent';
    } else {
      status = 'leave';
    }
  } else {
    status = 'absent';
  }

  let captainsNote = doc.captainsNote || doc.reviewNote || '';
  if (!captainsNote && doc.remarks && doc.remarks !== doc.studentsNote && doc.remarks !== doc.studentNote && doc.remarks !== doc.leaveReason) {
    captainsNote = doc.remarks;
  }
  if (status === 'fraud' && (!captainsNote || captainsNote === 'Frauded The attendance')) {
    captainsNote = 'Fraud Present Detected.';
  }
  const studentsNote = doc.studentsNote || doc.studentNote || (doc.leaveReason && doc.leaveReason.length > 25 ? doc.leaveReason : '');
  const isLeave = status === 'leave' || doc.leaveStatus === 'Approved' || doc.leaveStatus === 'Pending';
  let leaveReason = doc.leaveReason || doc.leaveType || '';
  if (isLeave) {
    if (!leaveReason || leaveReason === studentsNote || leaveReason.length > 25) {
      leaveReason = doc.leaveType || 'Casual';
    }
  }
  const leaveStatus = doc.leaveStatus || (status === 'leave' ? 'Approved' : 'None');
  const email = (doc.email || doc.studentEmail || user?.email || '').trim().toLowerCase();
  const reviewedBy = doc.reviewedBy || doc.markedBy || null;

  return {
    id: doc.id || (doc._id ? doc._id.toString() : `att-${doc.date}-${email || doc.studentId}`),
    email,
    date: doc.date || '',
    status,
    studentsNote,
    captainsNote,
    leaveReason,
    leaveStatus,
    reviewedBy,
    reviewedAt: doc.reviewedAt || null,
    submittedAt: doc.submittedAt || null,
    // Relational hydration from foreign key (email)
    studentId: user?.id || doc.studentId || '',
    studentRoll: user?.rollNumber || doc.studentRoll || doc.rollNumber || '',
    studentName: user?.fullName || doc.studentName || doc.fullName || 'Student',
    batch: (user?.batch || doc.batch || 'HSC 2026') as any,
    section: (user?.section || doc.section || 'A') as any,
    group: (user?.group || doc.group || 'Science') as any,
    markedBy: reviewedBy || { id: 'sys', name: 'Captain', role: 'captain' },
    remarks: captainsNote,
    timestamp: doc.timestamp || new Date().toISOString(),
  };
}

/**
 * Hydrates single-day leave request from unified attendance document using User entity via Foreign Key (email)
 */
export function formatLeaveDoc(doc: any, user?: User | null): LeaveRequest {
  if (!doc) return doc;
  const email = (doc.email || doc.studentEmail || user?.email || '').trim().toLowerCase();
  const date = doc.date || doc.leaveDate || doc.startDate || new Date().toISOString().split('T')[0];

  let resolvedStatus: LeaveStatus = 'Pending';
  if (doc.leaveStatus && doc.leaveStatus !== 'None') {
    resolvedStatus = doc.leaveStatus as LeaveStatus;
  } else if (doc.status === 'leave') {
    resolvedStatus = doc.reviewedBy ? 'Approved' : 'Pending';
  } else {
    resolvedStatus = 'Pending';
  }

  const captainsNote = doc.captainsNote || doc.reviewNote || doc.remarks || '';
  const detailedReason = doc.studentsNote || doc.studentNote || doc.reason || '';
  let leaveCategory = doc.leaveReason || doc.leaveType || 'Casual';
  if (leaveCategory === detailedReason || leaveCategory.length > 25) {
    leaveCategory = doc.leaveType || 'Casual';
  }
  const reviewedBy = doc.reviewedBy || doc.markedBy;

  return {
    id: doc.id || (doc._id ? doc._id.toString() : `leave-${email}-${date}`),
    // Relational hydration from foreign key (email)
    studentEmail: email,
    studentRole: user?.role || doc.studentRole || doc.role || 'student',
    studentId: user?.id || doc.studentId || '',
    studentRoll: user?.rollNumber || doc.studentRoll || doc.rollNumber || '',
    studentName: user?.fullName || doc.studentName || doc.fullName || 'Student',
    batch: (user?.batch || doc.batch || 'HSC 2026') as any,
    section: (user?.section || doc.section || 'A') as any,
    group: (user?.group || doc.group || 'Science') as any,
    leaveType: (leaveCategory as LeaveType) || 'Casual',
    startDate: date,
    endDate: date,
    daysCount: 1, // Single day leave constraint
    reason: detailedReason,
    leaveReason: leaveCategory,
    studentsNote: detailedReason,
    captainsNote,
    reviewNote: captainsNote,
    status: resolvedStatus,
    reviewedBy,
    reviewedAt: doc.reviewedAt,
    submittedAt: doc.submittedAt || doc.timestamp || new Date().toISOString(),
  };
}
