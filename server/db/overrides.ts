import { AttendanceEditOverride, CaptainEditPermissionStatus, HSCBatch, Section, UserRole, AuthSessionPayload, User } from '../../src/types.ts';
import { memoryOverrides, isMongoConnected } from './connection.ts';
import { AttendanceEditOverrideModel } from './models.ts';
import { compareBatch, compareSection } from './helpers.ts';

export function formatOverrideDoc(doc: any): AttendanceEditOverride {
  if (!doc) return doc;
  const id = doc.id || (doc._id ? doc._id.toString() : `override-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  
  const now = new Date();
  let status = doc.status || 'active';
  if (status === 'active' && doc.expiresAt) {
    if (new Date(doc.expiresAt).getTime() <= now.getTime()) {
      status = 'expired';
    }
  }

  return {
    id,
    captainId: doc.captainId || '',
    captainName: doc.captainName || 'Class Captain',
    captainEmail: (doc.captainEmail || '').toLowerCase().trim(),
    captainRoll: doc.captainRoll || '',
    batch: doc.batch as HSCBatch,
    section: doc.section as Section,
    targetDate: doc.targetDate,
    durationMinutes: Number(doc.durationMinutes) || 60,
    grantedAt: doc.grantedAt ? new Date(doc.grantedAt).toISOString() : new Date().toISOString(),
    expiresAt: doc.expiresAt ? new Date(doc.expiresAt).toISOString() : new Date(Date.now() + 3600000).toISOString(),
    grantedBy: {
      id: doc.grantedBy?.id || '',
      name: doc.grantedBy?.name || 'Administrator',
      email: (doc.grantedBy?.email || '').toLowerCase().trim(),
      role: doc.grantedBy?.role || 'admin',
    },
    reason: doc.reason || '',
    status,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export async function getAllAttendanceOverrides(filter?: {
  batch?: string;
  section?: string;
  captainId?: string;
  status?: string;
}): Promise<AttendanceEditOverride[]> {
  const now = new Date();

  if (isMongoConnected) {
    try {
      const query: any = {};
      if (filter?.batch) query.batch = filter.batch;
      if (filter?.section) query.section = filter.section;
      if (filter?.captainId) query.captainId = filter.captainId;

      const docs = await (AttendanceEditOverrideModel as any)
        .find(query)
        .sort({ createdAt: -1 })
        .lean();

      if (docs) {
        let results = docs.map(formatOverrideDoc);
        if (filter?.status) {
          if (filter.status === 'active') {
            results = results.filter((r: AttendanceEditOverride) => r.status === 'active' && new Date(r.expiresAt).getTime() > now.getTime());
          } else if (filter.status === 'expired') {
            results = results.filter((r: AttendanceEditOverride) => r.status === 'expired' || (r.status === 'active' && new Date(r.expiresAt).getTime() <= now.getTime()));
          } else if (filter.status === 'revoked') {
            results = results.filter((r: AttendanceEditOverride) => r.status === 'revoked');
          }
        }
        return results;
      }
    } catch (err) {
      console.warn('[ClassHQ DB] Error fetching overrides from Mongo:', err);
    }
  }

  let results = memoryOverrides.map(formatOverrideDoc);
  if (filter?.batch) {
    results = results.filter((o) => compareBatch(o.batch, filter.batch!));
  }
  if (filter?.section) {
    results = results.filter((o) => compareSection(o.section, filter.section!));
  }
  if (filter?.captainId) {
    results = results.filter((o) => o.captainId === filter.captainId || o.captainEmail.toLowerCase() === filter.captainId.toLowerCase());
  }
  if (filter?.status) {
    if (filter.status === 'active') {
      results = results.filter((r) => r.status === 'active' && new Date(r.expiresAt).getTime() > now.getTime());
    } else if (filter.status === 'expired') {
      results = results.filter((r) => r.status === 'expired' || (r.status === 'active' && new Date(r.expiresAt).getTime() <= now.getTime()));
    } else if (filter.status === 'revoked') {
      results = results.filter((r) => r.status === 'revoked');
    }
  }

  return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createAttendanceOverride(data: {
  captainId: string;
  captainName: string;
  captainEmail: string;
  captainRoll?: string;
  batch: HSCBatch;
  section: Section;
  targetDate: string;
  durationMinutes: number;
  reason?: string;
  grantedBy: {
    id: string;
    name: string;
    email: string;
    role?: UserRole;
  };
}): Promise<AttendanceEditOverride> {
  const now = new Date();
  const grantedAt = now.toISOString();
  const duration = Math.max(1, Number(data.durationMinutes) || 60);
  const expiresAt = new Date(now.getTime() + duration * 60 * 1000).toISOString();

  const newOverrideData = {
    captainId: data.captainId,
    captainName: data.captainName,
    captainEmail: data.captainEmail.toLowerCase().trim(),
    captainRoll: data.captainRoll || '',
    batch: data.batch,
    section: data.section,
    targetDate: data.targetDate,
    durationMinutes: duration,
    grantedAt,
    expiresAt,
    grantedBy: data.grantedBy,
    reason: data.reason || '',
    status: 'active' as const,
  };

  if (isMongoConnected) {
    try {
      const created = await (AttendanceEditOverrideModel as any).create(newOverrideData);
      const formatted = formatOverrideDoc(created.toObject ? created.toObject() : created);
      memoryOverrides.unshift(formatted);
      return formatted;
    } catch (err) {
      console.error('[ClassHQ DB] Error saving override to Mongo:', err);
    }
  }

  const inMemoryObj: AttendanceEditOverride = {
    id: `override-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...newOverrideData,
    createdAt: grantedAt,
    updatedAt: grantedAt,
  };

  memoryOverrides.unshift(inMemoryObj);
  return inMemoryObj;
}

export async function getValidActiveOverride(
  captainIdOrEmail: string,
  batch: string,
  section: string,
  targetDate: string
): Promise<AttendanceEditOverride | null> {
  const now = new Date();
  const normalizedIdOrEmail = (captainIdOrEmail || '').toLowerCase().trim();

  const all = await getAllAttendanceOverrides({ batch, section });
  const activeMatch = all.find((o) => {
    if (o.status !== 'active') return false;
    if (o.targetDate !== targetDate) return false;
    if (new Date(o.expiresAt).getTime() <= now.getTime()) return false;

    // Match captain specifically, or section-wide grant
    const matchUser =
      o.captainId === captainIdOrEmail ||
      o.captainEmail.toLowerCase() === normalizedIdOrEmail ||
      o.captainId === 'all';

    return matchUser && compareBatch(o.batch, batch) && compareSection(o.section, section);
  });

  return activeMatch || null;
}

export async function revokeAttendanceOverride(id: string): Promise<AttendanceEditOverride | null> {
  if (isMongoConnected) {
    try {
      const updated = await (AttendanceEditOverrideModel as any).findByIdAndUpdate(
        id,
        { status: 'revoked' },
        { new: true }
      ).lean();
      if (updated) {
        const formatted = formatOverrideDoc(updated);
        const idx = memoryOverrides.findIndex((m) => m.id === id);
        if (idx !== -1) memoryOverrides[idx] = formatted;
        return formatted;
      }
    } catch (err) {
      console.error('[ClassHQ DB] Error revoking override in Mongo:', err);
    }
  }

  const idx = memoryOverrides.findIndex((m) => m.id === id);
  if (idx !== -1) {
    memoryOverrides[idx].status = 'revoked';
    memoryOverrides[idx].updatedAt = new Date().toISOString();
    return memoryOverrides[idx];
  }

  return null;
}

export async function extendAttendanceOverride(
  id: string,
  additionalMinutes: number
): Promise<AttendanceEditOverride | null> {
  const extraMs = Math.max(1, additionalMinutes) * 60 * 1000;
  const now = new Date();

  if (isMongoConnected) {
    try {
      const existing = await (AttendanceEditOverrideModel as any).findById(id).lean();
      if (existing) {
        const currentExp = new Date(existing.expiresAt).getTime();
        const baseTime = currentExp > now.getTime() ? currentExp : now.getTime();
        const newExpiresAt = new Date(baseTime + extraMs).toISOString();

        const updated = await (AttendanceEditOverrideModel as any).findByIdAndUpdate(
          id,
          {
            expiresAt: newExpiresAt,
            status: 'active',
            durationMinutes: (Number(existing.durationMinutes) || 0) + additionalMinutes,
          },
          { new: true }
        ).lean();

        if (updated) {
          const formatted = formatOverrideDoc(updated);
          const idx = memoryOverrides.findIndex((m) => m.id === id);
          if (idx !== -1) memoryOverrides[idx] = formatted;
          return formatted;
        }
      }
    } catch (err) {
      console.error('[ClassHQ DB] Error extending override in Mongo:', err);
    }
  }

  const idx = memoryOverrides.findIndex((m) => m.id === id);
  if (idx !== -1) {
    const existing = memoryOverrides[idx];
    const currentExp = new Date(existing.expiresAt).getTime();
    const baseTime = currentExp > now.getTime() ? currentExp : now.getTime();
    existing.expiresAt = new Date(baseTime + extraMs).toISOString();
    existing.status = 'active';
    existing.durationMinutes = (Number(existing.durationMinutes) || 0) + additionalMinutes;
    existing.updatedAt = new Date().toISOString();
    return existing;
  }

  return null;
}

export async function checkCaptainEditPermission(
  user: AuthSessionPayload | User,
  targetDate: string
): Promise<CaptainEditPermissionStatus> {
  const now = new Date();
  // Server date formatted in YYYY-MM-DD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const serverDate = `${year}-${month}-${day}`;

  const isSameDay = targetDate === serverDate;

  // Window: 12:05 AM to 11:55 PM
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = 5; // 00:05 (12:05 AM)
  const endMinutes = 23 * 60 + 55; // 23:55 (11:55 PM)

  const isWithinTimeWindow = currentMinutes >= startMinutes && currentMinutes <= endMinutes;

  const captainId = (user as any).userId || user.id || '';
  const captainEmail = user.email || '';
  const batch = (user as any).assignedBatch || user.batch || '';
  const section = (user as any).assignedSection || user.section || '';

  // Get all active overrides for this captain across all dates
  const allBatchSectionOverrides = await getAllAttendanceOverrides({ batch, section, status: 'active' });
  const normalizedUser = (captainId || captainEmail).toLowerCase().trim();
  const activeGrants = allBatchSectionOverrides.filter((o) => {
    if (o.status !== 'active') return false;
    if (new Date(o.expiresAt).getTime() <= now.getTime()) return false;
    return (
      o.captainId === captainId ||
      o.captainEmail.toLowerCase() === normalizedUser ||
      o.captainId === 'all'
    );
  });

  // Check if an active override exists for this captain and target date
  const activeOverride = activeGrants.find((o) => o.targetDate === targetDate) || null;

  const serverTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (activeOverride) {
    const remainingSeconds = Math.max(
      0,
      Math.floor((new Date(activeOverride.expiresAt).getTime() - now.getTime()) / 1000)
    );

    return {
      allowed: true,
      reason: `Admin Override Active: Granted by ${activeOverride.grantedBy.name} (${Math.ceil(remainingSeconds / 60)} min remaining).`,
      isSameDay,
      isWithinTimeWindow,
      activeOverride,
      activeGrants,
      serverTime,
      serverDate,
      timeWindow: {
        start: '12:05 AM',
        end: '11:55 PM',
      },
      remainingSeconds,
    };
  }

  // If no override for selected date:
  if (!isSameDay) {
    const isPast = targetDate < serverDate;
    return {
      allowed: false,
      reason: isPast
        ? 'Past attendance ledger is locked. Captains can only update attendance on the same date between 12:05 AM and 11:55 PM, or with an Admin Override grant.'
        : 'Future attendance ledger is locked. Attendance can only be recorded on the day of class.',
      isSameDay: false,
      isWithinTimeWindow,
      activeOverride: null,
      activeGrants,
      serverTime,
      serverDate,
      timeWindow: {
        start: '12:05 AM',
        end: '11:55 PM',
      },
    };
  }

  // If same day but outside time window (12:05 AM to 11:55 PM):
  if (!isWithinTimeWindow) {
    return {
      allowed: false,
      reason: 'Daily roll-call window is closed for midnight ledger reset (11:55 PM - 12:05 AM). Regular certifying window resumes at 12:05 AM.',
      isSameDay: true,
      isWithinTimeWindow: false,
      activeOverride: null,
      activeGrants,
      serverTime,
      serverDate,
      timeWindow: {
        start: '12:05 AM',
        end: '11:55 PM',
      },
    };
  }

  // Same day and within 12:05 AM - 11:55 PM:
  return {
    allowed: true,
    reason: 'Same-day active roll-call window (12:05 AM to 11:55 PM).',
    isSameDay: true,
    isWithinTimeWindow: true,
    activeOverride: null,
    activeGrants,
    serverTime,
    serverDate,
    timeWindow: {
      start: '12:05 AM',
      end: '11:55 PM',
    },
  };
}
