import mongoose from 'mongoose';
import { User, AttendanceRecord, LeaveRequest } from '../../src/types.ts';
import { UserModel, AttendanceModel } from './models.ts';

// In-Memory store initialized for dynamic users & unified attendance records
export const memoryUsers: User[] = [];
export const memoryAttendance: any[] = [];
export const memoryLeaves: LeaveRequest[] = [];

export let isMongoConnected = false;
export let mongoConnectionError: string | null = null;
export let isConnecting = false;
let mongoConnectPromise: Promise<boolean> | null = null;

export async function initMongoDB(): Promise<boolean> {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri || uri.trim() === '') {
    // No URI provided yet - run in robust in-memory mode
    return false;
  }

  if (isMongoConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  if (mongoConnectPromise) {
    return mongoConnectPromise;
  }

  mongoConnectPromise = (async () => {
    try {
      isConnecting = true;
      console.log('[ClassHQ DB] Connecting to MongoDB...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        bufferCommands: false,
      });
      isMongoConnected = true;
      mongoConnectionError = null;
      console.log('[ClassHQ DB] Successfully connected to MongoDB cluster.');

      isConnecting = false;
      return true;
    } catch (err: any) {
      isConnecting = false;
      isMongoConnected = false;
      mongoConnectionError = err?.message || 'MongoDB connection error';
      console.warn('[ClassHQ DB] MongoDB connection failed. Falling back to active in-memory store:', mongoConnectionError);
      return false;
    } finally {
      mongoConnectPromise = null;
    }
  })();

  return mongoConnectPromise;
}

export async function getDatabaseStatus() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  let totalUsers = memoryUsers.length;
  let totalAttendanceLogs = memoryAttendance.length;
  let totalLeaves = memoryAttendance.filter(
    (a) => a.status === 'leave' || a.leaveStatus === 'Pending' || a.leaveStatus === 'Approved'
  ).length;

  if (isMongoConnected) {
    try {
      totalUsers = await UserModel.countDocuments();
      totalAttendanceLogs = await AttendanceModel.countDocuments();
      totalLeaves = await AttendanceModel.countDocuments({
        $or: [{ status: 'leave' }, { leaveStatus: { $in: ['Pending', 'Approved', 'Rejected'] } }],
      });
    } catch (err) {
      console.error('[ClassHQ DB] Error counting Mongo documents for status:', err);
    }
  }

  return {
    isConfigured: Boolean(uri && uri.trim() !== ''),
    isConnected: isMongoConnected,
    mode: isMongoConnected ? 'MongoDB Cloud Database' : 'In-Memory State Store (Active & Persistent)',
    error: mongoConnectionError,
    stats: {
      totalUsers,
      totalAttendanceLogs,
      totalLeaves,
    },
  };
}
