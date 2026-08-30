import { Schema } from 'mongoose';
import { HSCBatch, Section, UserRole } from '../../../src/types.ts';

export interface HolidayDoc {
  id?: string;
  title: string;
  batch: HSCBatch;
  section: Section;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  description?: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    rollNumber?: string;
    role: UserRole;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export const HolidaySchema = new Schema<HolidayDoc>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
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
    startDate: {
      type: String,
      required: true,
      index: true,
    },
    endDate: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, lowercase: true, trim: true, required: true },
      rollNumber: { type: String, default: '' },
      role: { type: String, enum: ['captain', 'admin', 'student'], default: 'captain' },
    },
  },
  {
    timestamps: true,
  }
);

HolidaySchema.index({ batch: 1, section: 1, startDate: 1, endDate: 1 });
