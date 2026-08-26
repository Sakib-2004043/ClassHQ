import { Router, Response } from 'express';
import {
  getAllUsers,
  getAttendanceBySectionAndDate,
  getLeavesBySection,
  saveOrUpdateAttendanceRecords,
  compareBatch,
  compareSection,
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
  HSCBatch,
  Section,
} from '../../src/types.ts';

export const captainRouter = Router();

captainRouter.use(authMiddleware);
captainRouter.use(requireRoles(['captain', 'admin']));

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

    const [existingRecords, sectionLeaves] = await Promise.all([
      getAttendanceBySectionAndDate(batch, section, date),
      getLeavesBySection(batch, section),
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
        studentsNote = 'Auto Marked as Absent';
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

        if (!existingNote) {
          studentsNote = 'Empty And Unknown';
        } else {
          studentsNote = existingNote;
        }
      }

      let captainsNote = rec?.captainsNote || approvedLeave?.captainsNote || approvedLeave?.reviewNote || '';
      if (String(status).toLowerCase() === 'fraud' && (!captainsNote || captainsNote === 'Frauded The attendance')) {
        captainsNote = 'Fraud Present Detected.';
      }
      const isLeaveStatus = String(status).toLowerCase() === 'leave';
      const leaveReason =
        approvedLeave?.reason ||
        rec?.leaveReason ||
        (isLeaveStatus ? (studentsNote !== 'Empty And Unknown' && studentsNote !== 'Auto Marked as Absent' ? studentsNote : '') : '');
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

    res.json({
      batch,
      section,
      date,
      totalEnrolled: sectionStudents.length,
      roster,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error fetching captain section roster.' });
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
