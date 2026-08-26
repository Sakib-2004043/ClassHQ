import { Router, Response } from 'express';
import {
  getAttendanceByStudent,
  getLeavesByStudent,
  getCaptainsBySectionAndBatch,
  createLeaveRequest,
  updateStudentLeaveRequest,
  saveOrUpdateAttendanceRecords,
  findUserById,
  findUserByEmail,
  getSystemSettingsDB,
} from '../db/index.ts';
import { requireAuth, AuthenticatedRequest } from '../auth.ts';
import { isTimeWithinWindow } from '../utils/timeWindow.ts';
import {
  AttendanceRecord,
  AttendanceStatus,
  LeaveRequest,
  LeaveType,
} from '../../src/types.ts';

export const studentRouter = Router();

// Student Dashboard Stats
studentRouter.get('/dashboard-stats', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = (req.query.studentId as string) || req.user?.userId;
    if (!studentId) {
      res.status(400).json({ error: 'Student ID required.' });
      return;
    }

    const studentEmail = req.user?.email;
    const attendanceRecords = await getAttendanceByStudent(studentId, studentEmail);
    const leaveRequests = await getLeavesByStudent(studentId);

    const totalDays = attendanceRecords.length;
    let daysPresent = 0;
    let daysAbsent = 0;
    let daysLeave = 0;
    let daysFraud = 0;

    for (const rec of attendanceRecords) {
      const st = String(rec.status || '').toLowerCase();
      if (st === 'present') daysPresent++;
      else if (st === 'absent') daysAbsent++;
      else if (st === 'leave' || st === 'excused' || st === 'late') daysLeave++;
      else if (st === 'fraud') daysFraud++;
      else daysPresent++;
    }

    const rawRate = totalDays > 0 ? ((daysPresent + daysLeave) / totalDays) * 100 : 100;
    const attendancePercentage = Math.round(rawRate * 10) / 10;

    const totalLeaveRequests = leaveRequests.length;
    const pendingLeaves = leaveRequests.filter((l) => l.status === 'Pending').length;
    const approvedLeaves = leaveRequests.filter((l) => l.status === 'Approved').length;

    res.json({
      attendancePercentage,
      totalDays,
      daysPresent,
      daysAbsent,
      daysLeave,
      daysFraud,
      daysLate: 0,
      daysExcused: 0,
      totalLeaveRequests,
      pendingLeaves,
      approvedLeaves,
      isWarning: attendancePercentage < 75,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error fetching student dashboard stats.' });
  }
});

// Student Attendance History
studentRouter.get('/attendance-history', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = (req.query.studentId as string) || req.user?.userId;
    if (!studentId) {
      res.status(400).json({ error: 'Student ID required.' });
      return;
    }

    const records = await getAttendanceByStudent(studentId, req.user?.email);
    res.json({ records });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error fetching attendance history.' });
  }
});

// Student Self-Report Attendance
studentRouter.post('/self-attendance', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, remarks } = req.body;
    const normalizedStatus = String(status || '').toLowerCase();
    if (!['present', 'absent'].includes(normalizedStatus)) {
      res.status(400).json({ error: 'Status must be either "present" or "absent".' });
      return;
    }

    const now = new Date();
    const settings = await getSystemSettingsDB();
    const startTime = settings.startTime || '3:00 PM';
    const endTime = settings.endTime || '12:00 AM';

    if (!isTimeWithinWindow(now, startTime, endTime)) {
      res.status(400).json({
        error: `Next-day attendance self-reporting window opens at ${startTime} today (Active window: ${startTime} – ${endTime}).`,
      });
      return;
    }

    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    while (targetDate.getDay() === 5 || targetDate.getDay() === 6) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    const calculatedDateStr = `${y}-${m}-${d}`;
    const dateStr =
      req.body.date && typeof req.body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.body.date)
        ? req.body.date
        : calculatedDateStr;

    const requestedDateObj = new Date(dateStr + 'T00:00:00');
    const requestedDayOfWeek = requestedDateObj.getDay();
    if (requestedDayOfWeek === 5 || requestedDayOfWeek === 6) {
      res.status(400).json({
        error: 'The requested date is Friday/Saturday (Weekend Holiday). Attendance self-reporting is for academic working days only.',
      });
      return;
    }
    const user = req.user!;

    const userLeaves = await getLeavesByStudent(user.userId);
    const approvedLeaveForDate = userLeaves.find(
      (l) => l.status === 'Approved' && (l.startDate === dateStr || l.endDate === dateStr || (l as any).date === dateStr)
    );
    if (approvedLeaveForDate) {
      res.status(400).json({
        error: `Attendance for ${dateStr} is locked because your leave application has been officially approved by section captain. You cannot edit or mark yourself present/absent.`,
      });
      return;
    }

    const fullUser = (await findUserById(user.userId)) || (await findUserByEmail(user.email));
    const gender = String(fullUser?.gender || (user as any).gender || '').toLowerCase();

    let studentNote = '';
    if (normalizedStatus === 'present') {
      if (gender.startsWith('m') || gender === 'male') {
        studentNote = 'Marked Himself As Present';
      } else if (gender.startsWith('f') || gender === 'female') {
        studentNote = 'Marked Herself As Present';
      } else {
        studentNote = 'Marked Himself/Herself As Present';
      }
    } else {
      if (gender.startsWith('m') || gender === 'male') {
        studentNote = 'Marked Himself As Absent';
      } else if (gender.startsWith('f') || gender === 'female') {
        studentNote = 'Marked Herself As Absent';
      } else {
        studentNote = 'Marked Himself/Herself As Absent';
      }
    }

    if (remarks && String(remarks).trim()) {
      studentNote = String(remarks).trim();
    }

    const newRecord: AttendanceRecord = {
      id: `att-${user.userId}-${dateStr}`,
      studentId: user.userId,
      studentName: user.fullName,
      email: user.email,
      batch: user.batch,
      section: user.section,
      group: user.group,
      date: dateStr,
      status: (normalizedStatus === 'present' ? 'Present' : 'Absent') as AttendanceStatus,
      studentsNote: studentNote,
      remarks: studentNote,
      markedBy: {
        id: user.userId,
        name: `${user.fullName} (Self)`,
        role: 'student',
      },
      timestamp: new Date().toISOString(),
    };

    await saveOrUpdateAttendanceRecords([newRecord]);

    res.json({
      success: true,
      message: `Your status for ${dateStr} has been recorded as ${normalizedStatus.toUpperCase()}.`,
      record: newRecord,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error recording self-attendance.' });
  }
});

// Student Leave Requests (List)
studentRouter.get('/leave-requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = (req.query.studentId as string) || req.user?.userId;
    if (!studentId) {
      res.status(400).json({ error: 'Student ID required.' });
      return;
    }

    const leaves = await getLeavesByStudent(studentId);
    res.json({ leaves });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error fetching leave requests.' });
  }
});

// Student Section Captain Info
studentRouter.get('/captain-info', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const batch = (req.query.batch as string) || req.user?.batch || 'HSC 2026';
    const section = (req.query.section as string) || req.user?.section || 'A';

    const captains = await getCaptainsBySectionAndBatch(batch, section);
    res.json({
      batch,
      section,
      captains: captains.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        rollNumber: c.rollNumber,
        email: c.email,
        phoneNumber: c.phoneNumber,
        assignedBatch: c.assignedBatch || c.batch,
        assignedSection: c.assignedSection || c.section,
        group: c.group,
        gender: c.gender,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error fetching section captain information.' });
  }
});

// Submit Leave Request
studentRouter.post('/leave-requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { leaveType, date, startDate, endDate, reason } = req.body;

    const targetDate = date || startDate;
    const targetEndDate = date || endDate || startDate;

    if (!leaveType || !targetDate || !reason || String(reason).trim().length < 5) {
      res.status(400).json({
        error: 'Please provide a valid leave type, date, and a detailed reason for absence (minimum 5 characters).',
      });
      return;
    }

    const start = new Date(targetDate);
    const end = new Date(targetEndDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: 'Invalid date provided.' });
      return;
    }

    if (end < start) {
      res.status(400).json({ error: 'End date cannot be prior to start date.' });
      return;
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const existingLeaves = await getLeavesByStudent(req.user!.userId);
    const alreadyApproved = existingLeaves.find(
      (l) =>
        l.status === 'Approved' &&
        (l.startDate === targetDate || l.endDate === targetDate || (l as any).date === targetDate)
    );
    if (alreadyApproved) {
      res.status(400).json({
        error: `An approved leave application already exists for ${targetDate}. Attendance is locked for this day.`,
      });
      return;
    }

    const newLeave: LeaveRequest = {
      id: `leave-req-${Date.now()}`,
      studentId: req.user!.userId,
      studentRoll: req.user!.rollNumber,
      studentName: req.user!.fullName,
      studentEmail: req.user!.email,
      batch: req.user!.batch,
      section: req.user!.section,
      group: req.user!.group,
      leaveType: (leaveType as LeaveType) || 'Casual',
      startDate: targetDate,
      endDate: targetEndDate,
      daysCount,
      reason: reason.trim(),
      status: 'Pending',
      submittedAt: new Date().toISOString(),
    };

    const created = await createLeaveRequest(newLeave);
    res.status(201).json({
      success: true,
      message: `Leave application for ${targetDate} submitted successfully! Your Section Captain has been notified for review.`,
      leave: created,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error submitting leave request.' });
  }
});

// Edit / Update Pending Leave Request by Student
studentRouter.patch('/leave-requests/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { leaveType, date, startDate, reason } = req.body;

    const targetDate = date || startDate;

    if (!targetDate && !leaveType && !reason) {
      res.status(400).json({ error: 'Please provide valid updates for date, leave type, or reason.' });
      return;
    }

    if (targetDate) {
      const dObj = new Date(targetDate);
      if (isNaN(dObj.getTime())) {
        res.status(400).json({ error: 'Invalid date provided.' });
        return;
      }
      const day = dObj.getDay();
      if (day === 5 || day === 6) {
        res.status(400).json({ error: 'Leave applications cannot be filed for weekends (Friday and Saturday).' });
        return;
      }
    }

    if (reason !== undefined && String(reason).trim().length < 5) {
      res.status(400).json({ error: 'Please provide a detailed reason for absence (minimum 5 characters).' });
      return;
    }

    const updated = await updateStudentLeaveRequest(
      id,
      {
        leaveType: leaveType as LeaveType,
        date: targetDate,
        reason: reason ? String(reason).trim() : undefined,
      },
      {
        id: req.user!.userId,
        email: req.user!.email,
        rollNumber: req.user!.rollNumber,
      }
    );

    if (!updated) {
      res.status(404).json({ error: 'Leave request not found or does not belong to your student account.' });
      return;
    }

    res.json({
      success: true,
      message: 'Leave application updated successfully.',
      leave: updated,
    });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Error updating leave request.' });
  }
});
