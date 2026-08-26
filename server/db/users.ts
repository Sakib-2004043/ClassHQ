import mongoose from 'mongoose';
import { User, ApprovalStatus, UserRole, HSCBatch, Section } from '../../src/types.ts';
import { memoryUsers, isMongoConnected } from './connection.ts';
import { UserModel } from './models.ts';
import { formatUserDoc, compareBatch, compareSection, normalizeBatch, normalizeSection } from './helpers.ts';

// In-memory cache for user list to eliminate repeated database roundtrips during roster and ledger loads
let usersCache: { data: User[]; timestamp: number } | null = null;
const USERS_CACHE_TTL = 30000; // 30 seconds TTL

export function invalidateUsersCache() {
  usersCache = null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  if (isMongoConnected) {
    try {
      const doc = await (UserModel as any).findOne({ email: normalized }).lean();
      if (doc) return formatUserDoc(doc);
    } catch (err) {
      console.error('[DB] findUserByEmail error:', err);
    }
  }
  const user = memoryUsers.find((u) => u.email.toLowerCase() === normalized);
  return user ? formatUserDoc(user) : null;
}

export async function findUserByRoll(rollNumber: string): Promise<User | null> {
  const normalized = rollNumber.trim().toUpperCase();
  if (isMongoConnected) {
    try {
      const doc = await (UserModel as any).findOne({
        $or: [
          { rollNumber: normalized },
          { roll: normalized },
          { rollNo: normalized },
          { rollNumber: { $regex: new RegExp(`^${normalized}$`, 'i') } },
        ]
      }).lean();
      if (doc) return formatUserDoc(doc);
    } catch (err) {
      console.error('[DB] findUserByRoll error:', err);
    }
  }
  const user = memoryUsers.find((u) => {
    const r = u.rollNumber || (u as any).roll || (u as any).rollNo || '';
    return r.toUpperCase() === normalized;
  });
  return user ? formatUserDoc(user) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  if (!id) return null;
  const trimmed = id.trim();
  if (isMongoConnected) {
    try {
      const isOid = mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24;
      const orConditions: any[] = [
        { id: trimmed },
        { email: trimmed.toLowerCase() },
        { rollNumber: trimmed.toUpperCase() },
      ];
      if (isOid) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(trimmed) });
      }
      const doc = await (UserModel as any).findOne({ $or: orConditions }).lean();
      if (doc) return formatUserDoc(doc);
    } catch (err) {
      console.error('[DB] findUserById error:', err);
    }
  }
  const user = memoryUsers.find(
    (u) =>
      u.id === trimmed ||
      (u as any)._id === trimmed ||
      u.email.toLowerCase() === trimmed.toLowerCase() ||
      (u.rollNumber && u.rollNumber.toUpperCase() === trimmed.toUpperCase())
  );
  return user ? formatUserDoc(user) : null;
}

export async function getAllUsers(forceRefresh = false): Promise<User[]> {
  const now = Date.now();
  if (!forceRefresh && usersCache && now - usersCache.timestamp < USERS_CACHE_TTL) {
    return usersCache.data;
  }

  if (isMongoConnected) {
    try {
      const docs = await (UserModel as any).find().lean();
      if (docs && docs.length > 0) {
        const formatted = docs.map(formatUserDoc);
        usersCache = { data: formatted, timestamp: now };
        return formatted;
      }
    } catch (err) {
      console.error('[DB] getAllUsers error:', err);
    }
  }
  const mem = memoryUsers.map(formatUserDoc);
  usersCache = { data: mem, timestamp: now };
  return mem;
}

export async function createUser(user: User): Promise<User> {
  invalidateUsersCache();
  const cleanBatch = normalizeBatch(user.batch) || '2026';
  const cleanAssignedBatch = user.assignedBatch ? normalizeBatch(user.assignedBatch) : undefined;
  const cleanSection = normalizeSection(user.section) || 'A';
  const cleanAssignedSection = user.assignedSection ? normalizeSection(user.assignedSection) : undefined;

  const dbUser = {
    ...user,
    email: (user.email || '').trim().toLowerCase(),
    batch: cleanBatch,
    assignedBatch: cleanAssignedBatch,
    section: cleanSection,
    assignedSection: cleanAssignedSection,
  };

  memoryUsers.unshift(formatUserDoc(dbUser));
  if (isMongoConnected) {
    try {
      await UserModel.create(dbUser);
    } catch (err) {
      console.error('[DB] Failed to insert user to Mongo:', err);
    }
  }
  return formatUserDoc(dbUser);
}

export async function updateUserApproval(id: string, approval: ApprovalStatus): Promise<User | null> {
  invalidateUsersCache();
  const trimmed = id.trim();
  let updatedUser: User | null = null;
  const memUser = memoryUsers.find((u) => u.id === trimmed || (u as any)._id === trimmed);
  if (memUser) {
    memUser.approval = approval;
    updatedUser = memUser;
  }
  if (isMongoConnected) {
    try {
      const isOid = mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24;
      const orConditions: any[] = [
        { id: trimmed },
        { email: { $regex: new RegExp(`^${trimmed}$`, 'i') } },
        { rollNumber: { $regex: new RegExp(`^${trimmed}$`, 'i') } },
      ];
      if (isOid) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(trimmed) });
      }
      const doc = await (UserModel as any).findOneAndUpdate(
        { $or: orConditions },
        { approval },
        { new: true }
      ).lean();
      if (doc) return formatUserDoc(doc);
    } catch (err) {
      console.error('[DB] Failed to update user in Mongo:', err);
    }
  }
  return updatedUser ? formatUserDoc(updatedUser) : null;
}

export async function updateUserRole(
  id: string,
  role: UserRole,
  assignedBatch?: HSCBatch,
  assignedSection?: Section
): Promise<User | null> {
  invalidateUsersCache();
  const trimmed = id.trim();
  let updatedUser: User | null = null;
  const memUser = memoryUsers.find((u) => u.id === trimmed || (u as any)._id === trimmed);
  if (memUser) {
    memUser.role = role;
    if (role === 'captain') {
      memUser.assignedBatch = assignedBatch ? (normalizeBatch(assignedBatch) as any) : memUser.batch;
      memUser.assignedSection = assignedSection ? (normalizeSection(assignedSection) as any) : memUser.section;
    } else if (role === 'student') {
      memUser.assignedBatch = undefined;
      memUser.assignedSection = undefined;
    }
    updatedUser = memUser;
  }
  if (isMongoConnected) {
    try {
      const isOid = mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24;
      const orConditions: any[] = [
        { id: trimmed },
        { email: { $regex: new RegExp(`^${trimmed}$`, 'i') } },
        { rollNumber: { $regex: new RegExp(`^${trimmed}$`, 'i') } },
      ];
      if (isOid) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(trimmed) });
      }
      const updateData: any = { role };
      if (role === 'captain') {
        updateData.assignedBatch = assignedBatch ? normalizeBatch(assignedBatch) : undefined;
        updateData.assignedSection = assignedSection ? normalizeSection(assignedSection) : undefined;
      } else if (role === 'student') {
        updateData.assignedBatch = null;
        updateData.assignedSection = null;
      }
      const doc = await (UserModel as any).findOneAndUpdate(
        { $or: orConditions },
        updateData,
        { new: true }
      ).lean();
      if (doc) return formatUserDoc(doc);
    } catch (err) {
      console.error('[DB] Failed to update user role in Mongo:', err);
    }
  }
  return updatedUser ? formatUserDoc(updatedUser) : null;
}

export async function updateUserSection(
  id: string,
  section: Section,
  batch?: HSCBatch
): Promise<User | null> {
  invalidateUsersCache();
  const trimmed = id.trim();
  const cleanSection = normalizeSection(section) || 'A';
  const cleanBatch = batch ? (normalizeBatch(batch) || '2026') : undefined;
  let updatedUser: User | null = null;
  const memUser = memoryUsers.find((u) => u.id === trimmed || (u as any)._id === trimmed);
  if (memUser) {
    memUser.section = cleanSection as Section;
    if (cleanBatch) memUser.batch = cleanBatch as HSCBatch;
    if (memUser.role === 'captain') {
      memUser.assignedSection = cleanSection as Section;
      if (cleanBatch) memUser.assignedBatch = cleanBatch as HSCBatch;
    }
    updatedUser = memUser;
  }
  if (isMongoConnected) {
    try {
      const isOid = mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24;
      const orConditions: any[] = [
        { id: trimmed },
        { email: { $regex: new RegExp(`^${trimmed}$`, 'i') } },
        { rollNumber: { $regex: new RegExp(`^${trimmed}$`, 'i') } },
      ];
      if (isOid) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(trimmed) });
      }
      const updateData: any = { section: cleanSection };
      if (cleanBatch) updateData.batch = cleanBatch;
      if (memUser?.role === 'captain') {
        updateData.assignedSection = cleanSection;
        if (cleanBatch) updateData.assignedBatch = cleanBatch;
      }
      const doc = await (UserModel as any).findOneAndUpdate(
        { $or: orConditions },
        updateData,
        { new: true }
      ).lean();
      if (doc) return formatUserDoc(doc);
    } catch (err) {
      console.error('[DB] Failed to update user section in Mongo:', err);
    }
  }
  return updatedUser ? formatUserDoc(updatedUser) : null;
}

export async function updateUserPassword(id: string, newPassword: string): Promise<User | null> {
  invalidateUsersCache();
  const trimmed = id.trim();
  let updatedUser: User | null = null;
  const memUser = memoryUsers.find((u) => u.id === trimmed || (u as any)._id === trimmed);
  if (memUser) {
    memUser.password = newPassword;
    updatedUser = memUser;
  }
  if (isMongoConnected) {
    try {
      const isOid = mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24;
      const orConditions: any[] = [
        { id: trimmed },
        { email: { $regex: new RegExp(`^${trimmed}$`, 'i') } },
        { rollNumber: { $regex: new RegExp(`^${trimmed}$`, 'i') } },
      ];
      if (isOid) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(trimmed) });
      }
      const doc = await (UserModel as any).findOneAndUpdate(
        { $or: orConditions },
        { password: newPassword },
        { new: true }
      ).lean();
      if (doc) return formatUserDoc(doc);
    } catch (err) {
      console.error('[DB] Failed to update password in Mongo:', err);
    }
  }
  return updatedUser ? formatUserDoc(updatedUser) : null;
}

export async function getCaptainsBySectionAndBatch(batch: string, section: string): Promise<User[]> {
  const allUsers = await getAllUsers();
  return allUsers.filter((u) => {
    if (u.role !== 'captain' || u.approval !== 'approved') return false;
    const captainBatch = u.assignedBatch || u.batch;
    const captainSection = u.assignedSection || u.section;
    return compareBatch(captainBatch, batch) && compareSection(captainSection, section);
  });
}
