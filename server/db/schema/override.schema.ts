import { Schema } from 'mongoose';
import { HSCBatch, Section, UserRole } from '../../../src/types.ts';

export interface AttendanceEditOverrideDoc {
  id?: string;
  captainId: string;
  captainName: string;
  captainEmail: string;
  captainRoll?: string;
  batch: HSCBatch;
  section: Section;
  targetDate: string; // "YYYY-MM-DD"
  durationMinutes: number;
  grantedAt: string; // ISO date string
  expiresAt: string; // ISO date string
  grantedBy: {
    id: string;
    name: string;
    email: string;
    role?: UserRole;
  };
  reason?: string;
  status: 'active' | 'expired' | 'revoked';
  createdAt?: Date;
  updatedAt?: Date;
}

export const AttendanceEditOverrideSchema = new Schema<AttendanceEditOverrideDoc>(
  {
    captainId: {
      type: String,
      required: true,
      index: true,
    },
    captainName: {
      type: String,
      required: true,
    },
    captainEmail: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
      index: true,
    },
    captainRoll: {
      type: String,
      default: '',
    },
    batch: {
      type: String,
      required: true,
      index: true,
    },
    section: {
      type: String,
      required: true,
      index: true,
    },
    targetDate: {
      type: String,
      required: true,
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 60,
    },
    grantedAt: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: String,
      required: true,
      index: true,
    },
    grantedBy: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, lowercase: true, trim: true, required: true },
      role: { type: String, default: 'admin' },
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'revoked'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

AttendanceEditOverrideSchema.index({ captainId: 1, targetDate: 1, status: 1 });
AttendanceEditOverrideSchema.index({ batch: 1, section: 1, targetDate: 1, status: 1 });
