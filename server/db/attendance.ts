import { AttendanceRecord } from '../../src/types.ts';
import { memoryAttendance, isMongoConnected } from './connection.ts';
import { AttendanceModel } from './models.ts';
import { getAllUsers } from './users.ts';
import { formatAttendanceDoc, compareBatch, compareSection } from './helpers.ts';

let lastAutoMarkTime = 0;
const AUTO_MARK_INTERVAL = 3 * 60 * 1000; // 3 minutes throttle

export async function autoMarkUnmarkedStudentsAsAbsent(force = false): Promise<void> {
  const nowTime = Date.now();
  if (!force && nowTime - lastAutoMarkTime < AUTO_MARK_INTERVAL) {
    return;
  }
  lastAutoMarkTime = nowTime;

  try {
    const allUsers = await getAllUsers();
    const students = allUsers.filter((u) => u.role === 'student' && u.approval === 'approved');
    if (students.length === 0) return;

    // Evaluate working dates from 7 days ago up to Today
    const now = new Date();
    const datesToCheck: string[] = [];

    for (let i = 0; i <= 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayOfWeek = d.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
      // Skip weekends (Friday & Saturday)
      if (dayOfWeek === 5 || dayOfWeek === 6) continue;
      datesToCheck.push(d.toISOString().slice(0, 10));
    }

    const studentEmails = students.map((s) => s.email.toLowerCase()).filter(Boolean);
    const existingKeySet = new Set<string>();

    // 1. Collect from memory store
    for (const a of memoryAttendance) {
      if (a.email && a.date) {
        existingKeySet.add(`${a.email.toLowerCase()}_${a.date}`);
      }
    }

    // 2. High-speed single batch query to MongoDB
    if (isMongoConnected && studentEmails.length > 0 && datesToCheck.length > 0) {
      try {
        const existingDocs = await (AttendanceModel as any)
          .find(
            {
              email: { $in: studentEmails },
              date: { $in: datesToCheck },
            },
            { email: 1, date: 1 }
          )
          .lean();

        if (existingDocs) {
          for (const doc of existingDocs) {
            if (doc.email && doc.date) {
              existingKeySet.add(`${doc.email.toLowerCase()}_${doc.date}`);
            }
          }
        }
      } catch (err) {
        console.error('[DB] Batch check attendance error in autoMark:', err);
      }
    }

    const newAbsentRecords: AttendanceRecord[] = [];

    for (const dateStr of datesToCheck) {
      for (const student of students) {
        const studentEmail = student.email.toLowerCase();
        const key = `${studentEmail}_${dateStr}`;
        if (!existingKeySet.has(key)) {
          const autoRecord: AttendanceRecord = {
            id: `att-auto-${student.id}-${dateStr}`,
            studentId: student.id,
            studentName: student.fullName,
            email: student.email,
            batch: student.batch || student.assignedBatch || 'HSC 2026',
            section: student.section || student.assignedSection || 'A',
            group: student.group || 'Science',
            date: dateStr,
            status: 'Absent',
            studentsNote: 'Auto Marked as Absent',
            remarks: 'Auto Marked as Absent',
            markedBy: {
              id: 'system',
              name: 'ClassHQ Auto-System',
              role: 'admin',
            },
            timestamp: new Date().toISOString(),
          };
          newAbsentRecords.push(autoRecord);
          existingKeySet.add(key);
        }
      }
    }

    if (newAbsentRecords.length > 0) {
      await saveOrUpdateAttendanceRecords(newAbsentRecords);
    }
  } catch (err) {
    console.error('[DB] Error in autoMarkUnmarkedStudentsAsAbsent:', err);
  }
}

export async function getAttendanceByStudent(identifier: string, email?: string): Promise<AttendanceRecord[]> {
  autoMarkUnmarkedStudentsAsAbsent().catch(console.error);

  const users = await getAllUsers();
  const targetUser = users.find(
    (u) =>
      u.id === identifier ||
      (email && u.email.toLowerCase() === email.trim().toLowerCase()) ||
      (u.rollNumber && u.rollNumber.toUpperCase() === identifier.toUpperCase())
  );
  const targetEmail = targetUser?.email.toLowerCase() || (email ? email.trim().toLowerCase() : '');

  if (isMongoConnected && targetEmail) {
    try {
      const docs = await (AttendanceModel as any)
        .find({ email: targetEmail })
        .sort({ date: -1 })
        .lean();
      if (docs && docs.length > 0) {
        return docs.map((doc: any) => formatAttendanceDoc(doc, targetUser));
      }
    } catch {
      // fallback
    }
  }

  return memoryAttendance
    .filter(
      (a) =>
        (targetEmail && (a.email || '').toLowerCase() === targetEmail) ||
        a.studentId === identifier
    )
    .map((a) => formatAttendanceDoc(a, targetUser))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getAttendanceBySectionAndDate(
  batch: string,
  section: string,
  date: string
): Promise<AttendanceRecord[]> {
  // Fire auto-mark in background so the request responds immediately
  autoMarkUnmarkedStudentsAsAbsent().catch(console.error);

  const allUsers = await getAllUsers();
  const sectionUsers = allUsers.filter(
    (u) =>
      compareBatch(u.batch || u.assignedBatch, batch) &&
      compareSection(u.section || u.assignedSection, section)
  );
  const userMap = new Map(sectionUsers.map((u) => [u.email.toLowerCase(), u]));
  const sectionEmails = sectionUsers.map((u) => u.email.toLowerCase()).filter(Boolean);

  if (isMongoConnected && sectionEmails.length > 0) {
    try {
      const docs = await (AttendanceModel as any)
        .find({
          email: { $in: sectionEmails },
          date,
        })
        .lean();
      if (docs && docs.length > 0) {
        return docs.map((doc: any) => {
          const user = userMap.get((doc.email || '').toLowerCase());
          return formatAttendanceDoc(doc, user);
        });
      }
    } catch {
      // fallback
    }
  }

  return memoryAttendance
    .filter((a) => {
      const user = userMap.get((a.email || '').toLowerCase());
      return user && a.date === date;
    })
    .map((a) => {
      const user = userMap.get((a.email || '').toLowerCase());
      return formatAttendanceDoc(a, user);
    });
}

export async function getAllAttendance(): Promise<AttendanceRecord[]> {
  autoMarkUnmarkedStudentsAsAbsent().catch(console.error);

  const allUsers = await getAllUsers();
  const userMap = new Map(allUsers.map((u) => [u.email.toLowerCase(), u]));

  if (isMongoConnected) {
    try {
      const docs = await (AttendanceModel as any).find().sort({ date: -1 }).lean();
      if (docs && docs.length > 0) {
        return docs.map((doc: any) => {
          const user = userMap.get((doc.email || '').toLowerCase());
          return formatAttendanceDoc(doc, user);
        });
      }
    } catch {
      // fallback
    }
  }

  return memoryAttendance
    .map((a) => {
      const user = userMap.get((a.email || '').toLowerCase());
      return formatAttendanceDoc(a, user);
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function saveOrUpdateAttendanceRecords(records: AttendanceRecord[]): Promise<void> {
  if (!records || records.length === 0) return;

  const allUsers = await getAllUsers();
  const userMap = new Map(allUsers.map((u) => [u.email.toLowerCase(), u]));
  const bulkOps: any[] = [];

  for (const record of records) {
    const email = (record.email || '').trim().toLowerCase();
    if (!email) continue;

    const user = userMap.get(email);
    const formatted = formatAttendanceDoc(record, user);

    // Save in in-memory store
    const existingIndex = memoryAttendance.findIndex(
      (a) => (a.email || '').toLowerCase() === email && a.date === formatted.date
    );
    if (existingIndex >= 0) {
      memoryAttendance[existingIndex] = formatted;
    } else {
      memoryAttendance.unshift(formatted);
    }

    // Prepare normalized payload for MongoDB
    const normalizedPayload = {
      email,
      date: formatted.date,
      status: formatted.status,
      studentsNote: formatted.studentsNote || '',
      captainsNote: formatted.captainsNote || '',
      leaveReason: formatted.leaveReason || '',
      leaveStatus: formatted.leaveStatus || 'None',
      reviewedBy: formatted.reviewedBy
        ? {
            id: formatted.reviewedBy.id || null,
            email: formatted.reviewedBy.email || null,
            name: formatted.reviewedBy.name || null,
            role: formatted.reviewedBy.role || null,
          }
        : formatted.markedBy
        ? {
            id: formatted.markedBy.id || null,
            email: null,
            name: formatted.markedBy.name || null,
            role: formatted.markedBy.role || null,
          }
        : null,
      reviewedAt: formatted.reviewedAt || null,
      submittedAt: formatted.submittedAt || null,
      timestamp: formatted.timestamp || new Date().toISOString(),
    };

    bulkOps.push({
      updateOne: {
        filter: { email, date: formatted.date },
        update: { $set: normalizedPayload },
        upsert: true,
      },
    });
  }

  // Execute bulkWrite in a single database roundtrip
  if (isMongoConnected && bulkOps.length > 0) {
    try {
      await (AttendanceModel as any).bulkWrite(bulkOps, { ordered: false });
    } catch (err) {
      console.error('[DB] Mongo attendance bulkWrite error:', err);
    }
  }
}

