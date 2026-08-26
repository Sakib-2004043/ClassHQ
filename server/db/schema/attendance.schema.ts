import mongoose, { Schema, model } from 'mongoose';

/**
 * Unified Attendance & Single-Day Leave Schema
 * Combines all logic into a single, highly-optimized schema.
 */
export const AttendanceSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
      ref: 'User', // Links directly to the email identifier of your User model
    },
    date: {
      type: String, // Expected Format: "YYYY-MM-DD"
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'leave'],
      required: true,
      default: 'absent',
    },
    studentsNote: {
      type: String,
      default: '',
      trim: true,
    },
    captainsNote: {
      type: String,
      default: '',
      trim: true,
    },
    leaveReason: {
      type: String,
      default: '',
      trim: true,
    },
    leaveStatus: {
      type: String,
      enum: ['None', 'Pending', 'Approved', 'Rejected'],
      default: 'None',
      index: true,
    },
    // Embedded marker object directly inside the single schema definition
    reviewedBy: {
      id: { type: String, default: null },
      email: { type: String, lowercase: true, trim: true, default: null },
      name: { type: String, default: null },
      role: { type: String, enum: ['captain', 'admin', 'student', null], default: null },
    },
    reviewedAt: {
      type: String,
      default: null,
    },
    submittedAt: {
      type: String,
      default: null,
    },
    timestamp: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  { 
    timestamps: true, 
    strict: true // Enforces strictly typed fields to maintain 100% database integrity
  }
);

// Critical compound index ensuring one attendance/leave record per student per date
AttendanceSchema.index({ email: 1, date: 1 }, { unique: true });

// Safe export pattern for Next.js App Router context
export const Attendance = mongoose.models.Attendance || model('Attendance', AttendanceSchema);
