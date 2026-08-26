import { Schema } from 'mongoose';
import { normalizeBatch } from '../helpers';

export const UserSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, trim: true, index: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phoneNumber: { type: String, default: '' },
    gender: { type: String, enum: ['Male', 'Female'], default: 'Male' },
    batch: {
      type: String,
      required: true,
      index: true,
      set: (val: any) => (val ? normalizeBatch(String(val)) : val),
    },
    group: { type: String, default: 'Science' },
    section: { type: String, required: true, index: true },
    address: { type: String, default: '' },
    role: { type: String, enum: ['student', 'captain', 'admin'], default: 'student', index: true },
    approval: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    password: { type: String },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true, strict: false }
);
