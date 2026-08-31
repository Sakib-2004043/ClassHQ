import { AttendanceRecord } from '../../src/types.ts';
import { memoryAttendance, isMongoConnected } from './connection.ts';
import { AttendanceModel } from './models.ts';
import { getAllUsers } from './users.ts';
import { formatAttendanceDoc, compareBatch, compareSection } from './helpers.ts';

export async function getAttendanceByStudent(identifier: string, email?: string): Promise<AttendanceRecord[]> {
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
      if (Array.isArray(docs)) {
        return docs.map((doc: any) => formatAttendanceDoc(doc, targetUser));
      }
    } catch (err) {
      console.error('[DB] Mongo getAttendanceByStudent error:', err);
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
      if (Array.isArray(docs)) {
        return docs.map((doc: any) => {
          const user = userMap.get((doc.email || '').toLowerCase());
          return formatAttendanceDoc(doc, user);
        });
      }
    } catch (err) {
      console.error('[DB] Mongo getAttendanceBySectionAndDate error:', err);
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
  const allUsers = await getAllUsers();
  const userMap = new Map(allUsers.map((u) => [u.email.toLowerCase(), u]));

  if (isMongoConnected) {
    try {
      const docs = await (AttendanceModel as any).find().sort({ date: -1 }).lean();
      if (Array.isArray(docs)) {
        return docs.map((doc: any) => {
          const user = userMap.get((doc.email || '').toLowerCase());
          return formatAttendanceDoc(doc, user);
        });
      }
    } catch (err) {
      console.error('[DB] Mongo getAllAttendance error:', err);
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

