import { Router, Response } from 'express';
import {
  getAllUsers,
  getAttendanceBySectionAndDate,
  getLeavesBySection,
  saveOrUpdateAttendanceRecords,
  findUserById,
  updateUserApproval,
  updateLeaveRequestStatus,
  getAttendanceByStudent,
  getLeavesByStudent,
  getAllLeaveRequests,
  compareBatch,
  compareSection,
  getHolidaysBySection,
  getHolidayForDate,
  createHoliday,
  deleteHoliday,
  checkCaptainEditPermission,
} from '../db/index.ts';
import {
  authMiddleware,
  requireRoles,
  AuthenticatedRequest,
} from '../auth.ts';
import {
  AttendanceRecord,
  AttendanceStatus,
  LeaveRequest,
  Holiday,
  HSCBatch,
  Section,
} from '../../src/types.ts';

export const captainRouter = Router();

captainRouter.use(authMiddleware);
captainRouter.use(requireRoles(['captain']));

// Section Roster with Attendance for Selected Date
captainRouter.get('/roster', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userSection = req.user?.assignedSection || req.user?.section;
    const userBatch = req.user?.assignedBatch || req.user?.batch;
    const isCaptain = req.user?.role === 'captain';

    const section = isCaptain && userSection ? userSection : (req.query.section as string) || userSection || 'A';
    const batch = isCaptain && userBatch ? userBatch : (req.query.batch as string) || userBatch || 'HSC 2026';
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

    const allUsers = await getAllUsers();
    const sectionStudents = allUsers.filter((u) => {
      const uBatch = u.role === 'captain' ? u.assignedBatch || u.batch : u.batch || u.assignedBatch;
      const uSection = u.role === 'captain' ? u.assignedSection || u.section : u.section || u.assignedSection;
      const isApproved = u.approval === 'approved' || u.role === 'captain' || u.role === 'admin';
      return (
        compareBatch(uBatch, batch) &&
        compareSection(uSection, section) &&
        isApproved &&
        (u.role === 'student' || u.role === 'captain')
      );
    });

    const [existingRecords, sectionLeaves, activeHoliday] = await Promise.all([
      getAttendanceBySectionAndDate(batch, section, date),
      getLeavesBySection(batch, section),
      getHolidayForDate(batch, section, date),
    ]);

    const recordMap = new Map<string, AttendanceRecord>();
    existingRecords.forEach((r) => {
      if (r.studentId) recordMap.set(r.studentId, r);
      if (r.email) recordMap.set(r.email.toLowerCase(), r);
    });

    const approvedLeaveMap = new Map<string, LeaveRequest>();
    sectionLeaves.forEach((l) => {
      if (l.status === 'Approved' && l.startDate <= date && l.endDate >= date) {
        if (l.studentId) approvedLeaveMap.set(l.studentId, l);
        if (l.studentEmail) approvedLeaveMap.set(l.studentEmail.toLowerCase(), l);
      }
    });

    const roster = sectionStudents.map((st) => {
      const rec = recordMap.get(st.id) || (st.email ? recordMap.get(st.email.toLowerCase()) : undefined);
      const approvedLeave =
        approvedLeaveMap.get(st.id) || (st.email ? approvedLeaveMap.get(st.email.toLowerCase()) : undefined);

      let status: AttendanceStatus = 'Absent';
      let studentsNote = '';

      if (!rec && !approvedLeave) {
        status = 'Absent';
        studentsNote = '';
      } else {
        if (rec) {
          status = rec.status;
        } else if (approvedLeave) {
          status = 'leave';
        }

        const existingNote = (
          rec?.studentsNote ||
          rec?.remarks ||
          approvedLeave?.reason ||
          approvedLeave?.studentsNote ||
          ''
        ).trim();

        studentsNote = existingNote;
      }

      let captainsNote = rec?.captainsNote || approvedLeave?.captainsNote || approvedLeave?.reviewNote || '';
      if (String(status).toLowerCase() === 'fraud' && (!captainsNote || captainsNote === 'Frauded The attendance')) {
        captainsNote = 'Fraud Present Detected.';
      }
      const isLeaveStatus = String(status).toLowerCase() === 'leave';
      const leaveReason =
        approvedLeave?.reason ||
        rec?.leaveReason ||
        (isLeaveStatus ? studentsNote : '');
      const leaveStatus = approvedLeave ? 'Approved' : rec?.leaveStatus || 'None';

      return {
        studentId: st.id,
        rollNumber: st.rollNumber,
        fullName: st.fullName,
        group: st.group,
        phoneNumber: st.phoneNumber,
        email: st.email,
        gender: st.gender || 'Male',
        role: st.role,
        status,
        isMarked: Boolean(rec),
        studentsNote,
        captainsNote,
        leaveReason,
        leaveStatus,
      };
    });

    const editPermission = await checkCaptainEditPermission(req.user!, date);

    res.json({
      batch,
      section,
      date,
      totalEnrolled: sectionStudents.length,
      activeHoliday,
      editPermission,
      roster,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error fetching captain section roster.' });
  }
});

// Check Edit Permission for Selected Date
captainRouter.get('/edit-permission', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date } = req.query;
    const targetDate = (date as string) || new Date().toISOString().split('T')[0];
    const permission = await checkCaptainEditPermission(req.user!, targetDate);
    res.json(permission);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error checking edit permission.' });
  }
});

// Mark / Save Section Attendance
captainRouter.post('/attendance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    let { batch, section, date, records } = req.body;
    const isCaptain = req.user?.role === 'captain';
    if (isCaptain) {
      batch = req.user?.assignedBatch || req.user?.batch || batch;
      section = req.user?.assignedSection || req.user?.section || section;
    }

    if (!batch || !section || !date || !Array.isArray(records)) {
      res.status(400).json({ error: 'batch, section, date, and records array are required.' });
      return;
    }

    // Check holiday restriction
    const activeHoliday = await getHolidayForDate(batch, section, date);
    if (activeHoliday) {
      res.status(400).json({
        error: `Roll call is locked for ${date}. Academic holiday in effect: ${activeHoliday.title} (${activeHoliday.startDate} to ${activeHoliday.endDate}).`,
        activeHoliday,
      });
      return;
    }

    // Check same-day window & admin override permission
    const editPermission = await checkCaptainEditPermission(req.user!, date);
    if (!editPermission.allowed) {
      res.status(403).json({
        error: editPermission.reason,
        permission: editPermission,
      });
      return;
    }

    const allUsers = await getAllUsers();
    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    const formattedRecords: AttendanceRecord[] = records.map((r: any) => {
      const student =
        userMap.get(r.studentId) ||
        allUsers.find((u) => u.email && r.email && u.email.toLowerCase() === r.email.toLowerCase());
      const email = student?.email || r.email || '';
      const rawStatus = (r.status || 'present').toString().toLowerCase();
      let status: AttendanceStatus = 'present';
      if (rawStatus === 'absent') status = 'absent';
      else if (rawStatus === 'fraud') status = 'Fraud';
      else if (rawStatus === 'leave' || rawStatus === 'excused' || rawStatus === 'late') status = 'leave';
      else status = 'present';

      let captainsNote = r.captainsNote || '';
      if (status === 'Fraud' && (!captainsNote.trim() || captainsNote === 'Frauded The attendance')) {
        captainsNote = 'Fraud Present Detected.';
      }
      const studentsNote = r.studentsNote || '';
      const leaveReason = r.leaveReason || (status === 'leave' ? studentsNote : '');
      const leaveStatus = status === 'leave' ? 'Approved' : 'None';

      return {
        id: `att-${date}-${student?.id || r.studentId}`,
        email,
        date,
        status,
        studentsNote,
        captainsNote,
        leaveReason,
        leaveStatus,
        studentId: student?.id || r.studentId,
        studentRoll: student?.rollNumber || r.rollNumber || 'N/A',
        studentName: student?.fullName || r.fullName || 'Student',
        batch: batch as HSCBatch,
        section: section as Section,
        group: student?.group || 'Science',
        reviewedBy: {
          id: req.user!.userId,
          email: req.user!.email,
          name: req.user!.fullName,
          role: req.user!.role,
        },
        markedBy: {
          id: req.user!.userId,
          name: req.user!.fullName,
          role: req.user!.role,
        },
        remarks: captainsNote,
        timestamp: new Date().toISOString(),
      };
    });

    await saveOrUpdateAttendanceRecords(formattedRecords);

    res.json({
      success: true,
      message: `Attendance marked successfully for ${formattedRecords.length} students on ${date}.`,
      count: formattedRecords.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error recording section attendance.' });
  }
});

// Section Leaves View (For Captain)
captainRouter.get('/section-leaves', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userSection = req.user?.assignedSection || req.user?.section;
    const userBatch = req.user?.assignedBatch || req.user?.batch;
    const isCaptain = req.user?.role === 'captain';

    const section = isCaptain && userSection ? userSection : (req.query.section as string) || userSection || 'A';
    const batch = isCaptain && userBatch ? userBatch : (req.query.batch as string) || userBatch || 'HSC 2026';

    const leaves = await getLeavesBySection(batch, section);

    // Captain cannot review their own leaves in section leaves queue
    const filteredLeaves =
      isCaptain && req.user
        ? leaves.filter((lv) => {
            const isOwn =
              (req.user!.userId && lv.studentId === req.user!.userId) ||
              (req.user!.email && lv.studentEmail && lv.studentEmail.toLowerCase() === req.user!.email.toLowerCase()) ||
              (req.user!.rollNumber && lv.studentRoll && lv.studentRoll.toString() === req.user!.rollNumber.toString());
            return !isOwn;
          })
        : leaves;

    res.json({ leaves: filteredLeaves });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error fetching section leaves.' });
  }
});

// Section Stats Overview
captainRouter.get('/section-stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userSection = req.user?.assignedSection || req.user?.section;
    const userBatch = req.user?.assignedBatch || req.user?.batch;
    const isCaptain = req.user?.role === 'captain';

    const section = isCaptain && userSection ? userSection : (req.query.section as string) || userSection || 'A';
    const batch = isCaptain && userBatch ? userBatch : (req.query.batch as string) || userBatch || 'HSC 2026';
    const today = new Date().toISOString().split('T')[0];

    const allUsers = await getAllUsers();
    const sectionStudents = allUsers.filter((u) => {
      const uBatch = u.role === 'captain' ? u.assignedBatch || u.batch : u.batch || u.assignedBatch;
      const uSection = u.role === 'captain' ? u.assignedSection || u.section : u.section || u.assignedSection;
      const isApproved = u.approval === 'approved' || u.role === 'captain' || u.role === 'admin';
      return (
        compareBatch(uBatch, batch) &&
        compareSection(uSection, section) &&
        isApproved &&
        (u.role === 'student' || u.role === 'captain')
      );
    });

    const todayAttendance = await getAttendanceBySectionAndDate(batch, section, today);
    const sectionLeaves = await getLeavesBySection(batch, section);

    let todayPresent = 0;
    let todayAbsent = 0;
    let todayLeave = 0;

    todayAttendance.forEach((a) => {
      const st = String(a.status || '').toLowerCase();
      if (st === 'present') todayPresent++;
      else if (st === 'absent') todayAbsent++;
      else if (st === 'leave' || st === 'excused' || st === 'late') todayLeave++;
      else todayPresent++;
    });

    res.json({
      batch,
      section,
      totalStudents: sectionStudents.length,
      todayPresent,
      todayAbsent,
      todayLeave,
      todayLate: 0,
      todayExcused: 0,
      todayMarked: todayAttendance.length > 0,
      pendingLeaves: sectionLeaves.filter((l) => l.status === 'Pending').length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error fetching captain section stats.' });
  }
});

// Section Students Directory for Captain
captainRouter.get('/students', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const capSection = req.user?.assignedSection || req.user?.section || 'A';
    const capBatch = req.user?.assignedBatch || req.user?.batch || 'HSC 2026';
    const { group, approval, search } = req.query;

    let users = await getAllUsers();
    const norm = (str?: string) => (str || '').trim().toUpperCase();

    // Filter strictly to Captain's section & batch
    users = users.filter((u) => {
      const uSection = u.section || u.assignedSection;
      const uBatch = u.batch || u.assignedBatch || (u as any).hscBatch;
      return compareSection(uSection, capSection) && compareBatch(uBatch, capBatch);
    });

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
    res.status(500).json({ error: err?.message || 'Error fetching section students.' });
  }
});

// Update Student Approval (Captain approving/rejecting a student in their section)
captainRouter.patch('/students/:id/approval', async (req: AuthenticatedRequest, res: Response) => {
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

    const capSection = req.user?.assignedSection || req.user?.section;
    const capBatch = req.user?.assignedBatch || req.user?.batch;
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

// Get Student Profile for Captain
captainRouter.get('/users/:id/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await findUserById(id);

    if (!user) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    const capSection = req.user?.assignedSection || req.user?.section;
    const capBatch = req.user?.assignedBatch || req.user?.batch;
    const studentSec = user.section || user.assignedSection;
    const studentBatch = user.batch || user.assignedBatch || (user as any).hscBatch;

    if (!compareSection(studentSec, capSection) || !compareBatch(studentBatch, capBatch)) {
      res.status(403).json({ error: 'Class Captain can only view student profiles matching their assigned batch and section.' });
      return;
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

// Review Leave Request (Captain reviewing leave for their section)
captainRouter.patch('/leaves/:id/review', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      res.status(400).json({ error: "Invalid status. Must be 'Approved', 'Rejected', or 'Pending'." });
      return;
    }

    const allLeaves = await getAllLeaveRequests();
    const targetLeave = allLeaves.find(
      (l) =>
        l.id === id ||
        l.id.toLowerCase() === id.toLowerCase() ||
        `leave-${(l.studentEmail || '').toLowerCase()}-${l.startDate}` === id.toLowerCase()
    );

    if (targetLeave) {
      const isOwn =
        (req.user?.userId && targetLeave.studentId === req.user.userId) ||
        (req.user?.email && targetLeave.studentEmail && targetLeave.studentEmail.toLowerCase() === req.user.email.toLowerCase()) ||
        (req.user?.rollNumber && targetLeave.studentRoll && targetLeave.studentRoll.toString() === req.user.rollNumber.toString());
      if (isOwn) {
        res.status(403).json({ error: 'Captains cannot review or approve their own leave applications. Another Captain or Admin must review it.' });
        return;
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

// Section Holidays List (For Captain)
captainRouter.get('/holidays', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userSection = req.user?.assignedSection || req.user?.section;
    const userBatch = req.user?.assignedBatch || req.user?.batch;
    const section = (req.query.section as string) || userSection || 'A';
    const batch = (req.query.batch as string) || userBatch || 'HSC 2026';

    const holidays = await getHolidaysBySection(batch, section);
    res.json({ batch, section, holidays });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error fetching section holidays.' });
  }
});

// Mark / Set Holiday (Captain setting holiday for their batch and section)
captainRouter.post('/holidays', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, startDate, endDate, description } = req.body;
    const batch = (req.user?.assignedBatch || req.user?.batch || req.body.batch || 'HSC 2026') as HSCBatch;
    const section = (req.user?.assignedSection || req.user?.section || req.body.section || 'A') as Section;

    if (!title || !startDate || !endDate) {
      res.status(400).json({ error: 'Holiday title, start date (From), and end date (To) are required.' });
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      res.status(400).json({ error: 'Dates must be in standard YYYY-MM-DD format.' });
      return;
    }

    if (endDate < startDate) {
      res.status(400).json({ error: 'End Date (To date) cannot be before Start Date (From date).' });
      return;
    }

    const holiday = await createHoliday({
      title: title.trim(),
      batch,
      section,
      startDate,
      endDate,
      description: (description || '').trim(),
      createdBy: {
        id: req.user!.userId,
        name: req.user!.fullName,
        email: req.user!.email,
        rollNumber: req.user!.rollNumber,
        role: req.user!.role,
      },
    });

    res.status(201).json({
      success: true,
      message: `Holiday '${holiday.title}' from ${holiday.startDate} to ${holiday.endDate} has been marked for Section ${section} (${batch}). Attendance marking is closed during this period.`,
      holiday,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error marking section holiday.' });
  }
});

// Delete / Remove Holiday Schedule
captainRouter.delete('/holidays/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteHoliday(id, {
      id: req.user!.userId,
      role: req.user!.role,
      batch: req.user?.assignedBatch || req.user?.batch,
      section: req.user?.assignedSection || req.user?.section,
    });

    if (!deleted) {
      res.status(404).json({ error: 'Holiday not found or already deleted.' });
      return;
    }

    res.json({ success: true, message: 'Holiday schedule has been removed successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Error deleting holiday.' });
  }
});

