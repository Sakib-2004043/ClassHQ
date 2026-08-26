import { Router, Response } from 'express';
import {
  getAllUsers,
  getAllLeaveRequests,
  getAllAttendance,
  findUserById,
  updateUserRole,
  updateUserSection,
  updateUserApproval,
  updateLeaveRequestStatus,
  getAttendanceByStudent,
  getLeavesByStudent,
  getSystemSettingsDB,
  updateSystemSettingsDB,
  compareBatch,
  compareSection,
} from '../db/index.ts';
import {
  authMiddleware,
  requireRoles,
  AuthenticatedRequest,
} from '../auth.ts';
import {
  User,
  UserRole,
  HSCBatch,
  Section,
  AttendanceRecord,
} from '../../src/types.ts';

export const adminRouter = Router();

adminRouter.use(authMiddleware);

// System Settings (Admin only)
adminRouter.get('/settings', requireRoles(['admin']), async (req, res: Response) => {
  try {
    const settings = await getSystemSettingsDB();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

adminRouter.patch('/settings', requireRoles(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startTime, endTime } = req.body;
    if (!startTime || !endTime) {
      res.status(400).json({ error: 'startTime and endTime are required' });
      return;
    }

    const settings = await updateSystemSettingsDB(startTime, endTime, req.user?.fullName || 'System Admin');
    res.json({ success: true, message: 'Settings updated successfully', settings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Admin Overview Statistics
adminRouter.get('/overview-stats', requireRoles(['admin']), async (req, res: Response) => {
  try {
    const allUsers = await getAllUsers();
    const allLeaves = await getAllLeaveRequests();
    const allAttendance = await getAllAttendance();

    const students = allUsers.filter((u) => u.role === 'student');
    const captains = allUsers.filter((u) => u.role === 'captain');
    const pendingStudentApprovals = allUsers.filter((u) => u.approval === 'pending').length;
    const pendingLeaveApprovals = allLeaves.filter((l) => l.status === 'Pending').length;

    const today = new Date().toISOString().split('T')[0];
    const todayLogs = allAttendance.filter((a) => a.date === today);
    const todayPresentCount = todayLogs.filter((a) => {
      const s = String(a.status || '').toLowerCase();
      return s === 'present' || s === 'leave' || s === 'excused' || s === 'late';
    }).length;
    const todayInstitutionAttendanceRate =
      todayLogs.length > 0 ? Math.round((todayPresentCount / todayLogs.length) * 100) : 0;

    const enrolledApprovedUsers = allUsers.filter(
      (u) => (u.role === 'student' || u.role === 'captain') && u.approval === 'approved'
    );
    const batches = new Set(enrolledApprovedUsers.map((u) => u.batch));
    const sections = new Set(enrolledApprovedUsers.map((u) => u.section));

    // Section-wise breakdown
    const sectionMap = new Map<string, { batch: HSCBatch; section: Section; students: User[]; records: AttendanceRecord[] }>();
    students.filter((s) => s.approval === 'approved').forEach((s) => {
      const key = `${s.batch}-${s.section}`;
      if (!sectionMap.has(key)) {
        sectionMap.set(key, { batch: s.batch, section: s.section, students: [], records: [] });
      }
      sectionMap.get(key)!.students.push(s);
    });

    allAttendance.forEach((rec) => {
      const key = `${rec.batch}-${rec.section}`;
      if (sectionMap.has(key)) {
        sectionMap.get(key)!.records.push(rec);
      }
    });

    const sectionAttendanceBreakdown = Array.from(sectionMap.values()).map((sec) => {
      const totalLogs = sec.records.length;
      const presentLogs = sec.records.filter((r) => {
        const s = String(r.status || '').toLowerCase();
        return s === 'present' || s === 'leave' || s === 'excused' || s === 'late';
      }).length;
      const attendanceRate = totalLogs > 0 ? Math.round((presentLogs / totalLogs) * 100) : 0;
      return {
        batch: sec.batch,
        section: sec.section,
        totalStudents: sec.students.length,
        attendanceRate,
      };
    });

    // Low attendance student list (<75%) and compliance tiers
    const lowAttendanceStudents: Array<{
      studentId: string;
      rollNumber: string;
      fullName: string;
      batch: HSCBatch;
      section: Section;
      attendancePercentage: number;
      presentDays: number;
      totalClasses: number;
    }> = [];

    let distinctionCount = 0;
    let satisfactoryCount = 0;
    let atRiskCount = 0;
    let criticalCount = 0;

    const approvedStudents = students.filter((s) => s.approval === 'approved');

    approvedStudents.forEach((st) => {
      const stRecords = allAttendance.filter((r) => r.studentId === st.id);
      const total = stRecords.length;
      let rate = 100;
      let present = 0;

      if (total > 0) {
        present = stRecords.filter((r) => {
          const s = String(r.status || '').toLowerCase();
          return s === 'present' || s === 'leave' || s === 'excused' || s === 'late';
        }).length;
        rate = Math.round((present / total) * 100);
      }

      if (rate >= 90) distinctionCount++;
      else if (rate >= 75) satisfactoryCount++;
      else if (rate >= 60) atRiskCount++;
      else criticalCount++;

      if (total > 0 && rate < 75) {
        lowAttendanceStudents.push({
          studentId: st.id,
          rollNumber: st.rollNumber,
          fullName: st.fullName,
          batch: st.batch,
          section: st.section,
          attendancePercentage: rate,
          presentDays: present,
          totalClasses: total,
        });
      }
    });

    const totalEvaluated = approvedStudents.length || 1;
    const complianceTiers = [
      { tier: 'Distinction (≥90%)', range: '90-100%', count: distinctionCount, percentage: Math.round((distinctionCount / totalEvaluated) * 100), color: '#10b981' },
      { tier: 'Satisfactory (75-89%)', range: '75-89%', count: satisfactoryCount, percentage: Math.round((satisfactoryCount / totalEvaluated) * 100), color: '#3b82f6' },
      { tier: 'At Risk (60-74%)', range: '60-74%', count: atRiskCount, percentage: Math.round((atRiskCount / totalEvaluated) * 100), color: '#f59e0b' },
      { tier: 'Critical (<60%)', range: '<60%', count: criticalCount, percentage: Math.round((criticalCount / totalEvaluated) * 100), color: '#f43f5e' },
    ];

    // Daily Trend
    const dateMap = new Map<string, { present: number; absent: number; late: number; total: number }>();
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      dateMap.set(iso, { present: 0, absent: 0, late: 0, total: 0 });
    }

    allAttendance.forEach((rec) => {
      if (rec.date && dateMap.has(rec.date)) {
        const entry = dateMap.get(rec.date)!;
        entry.total++;
        const st = String(rec.status || '').toLowerCase();
        if (st === 'present') entry.present++;
        else if (st === 'late') {
          entry.late++;
          entry.present++;
        } else if (st === 'absent') {
          entry.absent++;
        } else if (st === 'leave' || st === 'excused') {
          entry.present++;
        }
      }
    });

    const dailyTrend = Array.from(dateMap.entries()).map(([dt, data]) => {
      const dObj = new Date(dt);
      const formattedDate = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const rate = data.total > 0 ? Math.round((data.present / data.total) * 100) : todayInstitutionAttendanceRate || 92;
      return {
        date: dt,
        formattedDate,
        rate,
        present: data.present,
        absent: data.absent,
        late: data.late,
        total: data.total,
      };
    });

    // Status Distribution
    let totalPresents = 0;
    let totalAbsents = 0;
    let totalLates = 0;
    let totalExcused = 0;

    allAttendance.forEach((rec) => {
      const st = String(rec.status || '').toLowerCase();
      if (st === 'present') totalPresents++;
      else if (st === 'absent') totalAbsents++;
      else if (st === 'late') totalLates++;
      else if (st === 'leave' || st === 'excused') totalExcused++;
    });

    const totalLogsAll = allAttendance.length || 1;
    const statusDistribution = [
      { name: 'Present', count: totalPresents || (allAttendance.length === 0 ? 85 : 0), percentage: Math.round(((totalPresents || 85) / totalLogsAll) * 100), color: '#10b981' },
      { name: 'Absent', count: totalAbsents, percentage: Math.round((totalAbsents / totalLogsAll) * 100), color: '#f43f5e' },
      { name: 'Late', count: totalLates, percentage: Math.round((totalLates / totalLogsAll) * 100), color: '#f59e0b' },
      { name: 'Excused / Leave', count: totalExcused, percentage: Math.round((totalExcused / totalLogsAll) * 100), color: '#06b6d4' },
    ];

    // Batch Breakdown
    const standardBatches = ['2024', '2025', '2026'];
    const batchBreakdown = standardBatches.map((b) => {
      const batchStudents = students.filter((s) => String(s.batch || '').replace(/\D+/g, '') === b);
      const approved = batchStudents.filter((s) => s.approval === 'approved');
      const batchCaptains = captains.filter((c) => String(c.batch || c.assignedBatch || '').replace(/\D+/g, '') === b);
      const batchRecords = allAttendance.filter((a) => String(a.batch || '').replace(/\D+/g, '') === b);
      const presentLogs = batchRecords.filter((r) => {
        const s = String(r.status || '').toLowerCase();
        return s === 'present' || s === 'leave' || s === 'excused' || s === 'late';
      }).length;
      const attendanceRate = batchRecords.length > 0 ? Math.round((presentLogs / batchRecords.length) * 100) : 90;
      return {
        batch: `HSC ${b}`,
        totalStudents: batchStudents.length,
        approvedStudents: approved.length,
        captainsCount: batchCaptains.length,
        attendanceRate,
      };
    });

    // Academic Group Breakdown
    const standardGroups = ['Science', 'Business Studies', 'Humanities'];
    const groupBreakdown = standardGroups.map((grp) => {
      const grpStudents = students.filter((s) => s.group === grp && s.approval === 'approved');
      const grpStudentIds = new Set(grpStudents.map((s) => s.id));
      const grpRecords = allAttendance.filter((a) => grpStudentIds.has(a.studentId));
      const presentLogs = grpRecords.filter((r) => {
        const s = String(r.status || '').toLowerCase();
        return s === 'present' || s === 'leave' || s === 'excused' || s === 'late';
      }).length;
      const attendanceRate = grpRecords.length > 0 ? Math.round((presentLogs / grpRecords.length) * 100) : 92;
      return {
        group: grp,
        totalStudents: grpStudents.length,
        attendanceRate,
      };
    });

    res.json({
      totalStudents: students.length,
      totalCaptains: captains.length,
      captainsCount: captains.length,
      pendingStudentApprovals,
      pendingLeaveApprovals,
      totalLeavesRecorded: allLeaves.length,
      todayInstitutionAttendanceRate,
      batchesCount: batches.size || 3,
      sectionsCount: sections.size || 4,
      sectionAttendanceBreakdown,
      lowAttendanceStudents,
      dailyTrend,
      statusDistribution,
      batchBreakdown,
      groupBreakdown,
      complianceTiers,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error fetching admin overview stats.' });
  }
});

// Comprehensive Student & Captain Directory
adminRouter.get('/students', requireRoles(['admin', 'captain']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batch, section, group, approval, role, search } = req.query;
    let users = await getAllUsers();
    const norm = (str?: string) => (str || '').trim().toUpperCase();

    if (req.user?.role === 'captain') {
      const capSection = req.user.assignedSection || req.user.section;
      const capBatch = req.user.assignedBatch || req.user.batch;
      users = users.filter((u) => {
        const uSection = u.section || u.assignedSection;
        const uBatch = u.batch || u.assignedBatch || (u as any).hscBatch;
        return compareSection(uSection, capSection) && compareBatch(uBatch, capBatch);
      });
    }

    if (role && role !== 'ALL') {
      users = users.filter((u) => norm(u.role) === norm(role as string));
    }
    if (batch && batch !== 'ALL') {
      users = users.filter((u) => {
        const uBatch = u.batch || u.assignedBatch || (u as any).hscBatch;
        return compareBatch(uBatch, batch as string);
      });
    }
    if (section && section !== 'ALL') {
      users = users.filter((u) => {
        const uSection = u.section || u.assignedSection;
        return compareSection(uSection, section as string);
      });
    }
    if (group && group !== 'ALL') {
      users = users.filter((u) => norm(u.group) === norm(group as string));
    }
    if (approval && approval !== 'ALL') {
      users = users.filter((u) => norm(u.approval) === norm(approval as string));
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      users = users.filter(
        (u) =>
          (u.fullName && typeof u.fullName === 'string' && u.fullName.toLowerCase().includes(q)) ||
          (u.rollNumber && typeof u.rollNumber === 'string' && u.rollNumber.toLowerCase().includes(q)) ||
          (u.email && typeof u.email === 'string' && u.email.toLowerCase().includes(q)) ||
          (u.phoneNumber && typeof u.phoneNumber === 'string' && u.phoneNumber.toLowerCase().includes(q))
      );
    }

    res.json({
      total: users.length,
      students: users,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error fetching directory list.' });
  }
});

// Promote Student to Captain or Demote Captain to Student
adminRouter.patch('/users/:id/role', requireRoles(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, assignedBatch, assignedSection } = req.body;

    if (!role || !['student', 'captain'].includes(role)) {
      res.status(400).json({ error: "Invalid role. Role must be 'student' or 'captain'." });
      return;
    }

    const existingUser = await findUserById(id);
    if (!existingUser) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    if (existingUser.role === 'admin') {
      res.status(400).json({ error: 'Cannot modify Chief Administrator role.' });
      return;
    }

    const updated = await updateUserRole(
      id,
      role as UserRole,
      (assignedBatch as HSCBatch) || existingUser.batch,
      (assignedSection as Section) || existingUser.section
    );

    if (!updated) {
      res.status(404).json({ error: 'Failed to update user role.' });
      return;
    }

    const actionText = role === 'captain' ? 'promoted to Class Captain' : 'reverted to Student';
    res.json({
      success: true,
      message: `Account ${updated.fullName} (${updated.rollNumber}) has been successfully ${actionText}.`,
      user: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error updating user role.' });
  }
});

// Shift Student or Captain to a Different Section
adminRouter.patch('/users/:id/section', requireRoles(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { section, batch } = req.body;

    if (!section) {
      res.status(400).json({ error: 'Section is required (e.g. A, B, C, D).' });
      return;
    }

    const existingUser = await findUserById(id);
    if (!existingUser) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    if (existingUser.role === 'admin') {
      res.status(400).json({ error: 'Cannot shift section for Chief Administrator.' });
      return;
    }

    const prevSection = existingUser.section || existingUser.assignedSection || 'A';
    const prevBatch = existingUser.batch || existingUser.assignedBatch || '2026';

    const updated = await updateUserSection(
      id,
      section as Section,
      batch ? (batch as HSCBatch) : undefined
    );

    if (!updated) {
      res.status(404).json({ error: 'Failed to update section for user.' });
      return;
    }

    const newSection = updated.section || updated.assignedSection || 'A';
    const newBatch = updated.batch || updated.assignedBatch || '2026';
    const roleLabel = updated.role === 'captain' ? 'Section Captain' : 'Student';

    res.json({
      success: true,
      message: `${roleLabel} ${updated.fullName} (Roll: ${updated.rollNumber}) successfully shifted from Section ${prevSection} to Section ${newSection} (${newBatch}).`,
      user: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error shifting section.' });
  }
});

// Get Comprehensive User / Student Profile
adminRouter.get('/users/:id/profile', requireRoles(['admin', 'captain']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await findUserById(id);

    if (!user) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    if (req.user?.role === 'captain') {
      const capSection = req.user.assignedSection || req.user.section;
      const capBatch = req.user.assignedBatch || req.user.batch;
      const studentSec = user.section || user.assignedSection;
      const studentBatch = user.batch || user.assignedBatch || (user as any).hscBatch;
      if (!compareSection(studentSec, capSection) || !compareBatch(studentBatch, capBatch)) {
        res.status(403).json({ error: 'Class Captain can only view student profiles matching their assigned batch and section.' });
        return;
      }
    }

    const [attendanceRecords, leaveRequests] = await Promise.all([
      getAttendanceByStudent(id),
      getLeavesByStudent(id),
    ]);

    const totalDays = attendanceRecords.length;
    let daysPresent = 0;
    let daysAbsent = 0;
    let daysLate = 0;
    let daysExcused = 0;

    for (const rec of attendanceRecords) {
      const st = String(rec.status || '').toLowerCase();
      if (st === 'present') daysPresent++;
      else if (st === 'absent') daysAbsent++;
      else if (st === 'leave' || st === 'excused' || st === 'late') daysLate++;
      else daysPresent++;
    }

    const rawRate = totalDays > 0 ? ((daysPresent + daysExcused + daysLate * 0.75) / totalDays) * 100 : 100;
    const attendancePercentage = Math.round(rawRate * 10) / 10;

    const totalLeaveRequests = leaveRequests.length;
    const pendingLeaves = leaveRequests.filter((l) => l.status === 'Pending').length;
    const approvedLeaves = leaveRequests.filter((l) => l.status === 'Approved').length;

    const attendanceStats = {
      attendancePercentage,
      totalDays,
      daysPresent,
      daysAbsent,
      daysLate,
      daysExcused,
      totalLeaveRequests,
      pendingLeaves,
      approvedLeaves,
      isWarning: attendancePercentage < 75,
    };

    res.json({
      success: true,
      user,
      attendanceStats,
      attendanceRecords,
      leaveRequests,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error fetching user profile.' });
  }
});

// Approve or Reject Student Registration
adminRouter.patch('/students/:id/approval', requireRoles(['admin', 'captain']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { approval } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(approval)) {
      res.status(400).json({ error: "Invalid approval status. Must be 'approved', 'rejected', or 'pending'." });
      return;
    }

    const targetStudent = await findUserById(id);
    if (!targetStudent) {
      res.status(404).json({ error: 'Student account not found.' });
      return;
    }

    if (req.user?.role === 'captain') {
      const capSection = req.user.assignedSection || req.user.section;
      const capBatch = req.user.assignedBatch || req.user.batch;
      const studentSec = targetStudent.section || targetStudent.assignedSection;
      const studentBatch = targetStudent.batch || targetStudent.assignedBatch || (targetStudent as any).hscBatch;
      if (!compareSection(studentSec, capSection) || !compareBatch(studentBatch, capBatch)) {
        res.status(403).json({ error: 'Class Captain can only approve students matching their assigned batch and section.' });
        return;
      }

      if (targetStudent.role === 'captain' && approval !== 'approved') {
        res.status(403).json({ error: 'Captains cannot revoke approval or reject other Captains.' });
        return;
      }
    }

    const updated = await updateUserApproval(id, approval);
    if (!updated) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }

    res.json({
      success: true,
      message: `Student ${updated.fullName} (${updated.rollNumber}) status updated to '${approval}'.`,
      student: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error updating student approval.' });
  }
});

// Admin All Leave Applications
adminRouter.get('/leaves', requireRoles(['admin']), async (req, res: Response) => {
  try {
    const { status, batch, section } = req.query;
    let leaves = await getAllLeaveRequests();

    if (status && status !== 'ALL') {
      leaves = leaves.filter((l) => l.status === status);
    }
    if (batch && batch !== 'ALL') {
      leaves = leaves.filter((l) => l.batch === batch);
    }
    if (section && section !== 'ALL') {
      leaves = leaves.filter((l) => l.section === section);
    }

    res.json({
      total: leaves.length,
      leaves,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error fetching all leave requests.' });
  }
});

// Approve or Reject Leave Request
adminRouter.patch('/leaves/:id/review', requireRoles(['admin', 'captain']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      res.status(400).json({ error: "Invalid status. Must be 'Approved', 'Rejected', or 'Pending'." });
      return;
    }

    if (req.user?.role === 'captain') {
      const allLeaves = await getAllLeaveRequests();
      const targetLeave = allLeaves.find(
        (l) =>
          l.id === id ||
          l.id.toLowerCase() === id.toLowerCase() ||
          `leave-${(l.studentEmail || '').toLowerCase()}-${l.startDate}` === id.toLowerCase()
      );
      if (targetLeave) {
        const isOwn =
          (req.user.userId && targetLeave.studentId === req.user.userId) ||
          (req.user.email && targetLeave.studentEmail && targetLeave.studentEmail.toLowerCase() === req.user.email.toLowerCase()) ||
          (req.user.rollNumber && targetLeave.studentRoll && targetLeave.studentRoll.toString() === req.user.rollNumber.toString());
        if (isOwn) {
          res.status(403).json({ error: 'Captains cannot review or approve their own leave applications. Another Captain or Admin must review it.' });
          return;
        }
      }
    }

    const reviewer = {
      id: req.user!.userId,
      name: req.user!.fullName,
      role: req.user!.role,
    };

    const updated = await updateLeaveRequestStatus(id, status, reviewer, reviewNote);
    if (!updated) {
      res.status(404).json({ error: 'Leave request not found.' });
      return;
    }

    res.json({
      success: true,
      message: `Leave application for ${updated.studentName} has been ${status}.`,
      leave: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error reviewing leave application.' });
  }
});
