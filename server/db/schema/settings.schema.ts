import { Schema } from 'mongoose';

export interface SystemSettingsDoc {
  key: string;
  startTime: string;
  endTime: string;
  updatedBy: string;
  updatedAt?: Date;
}

export const SystemSettingsSchema = new Schema<SystemSettingsDoc>(
  {
    key: { type: String, required: true, unique: true, default: 'global_settings' },
    startTime: { type: String, required: true, default: '3:00 PM' },
    endTime: { type: String, required: true, default: '12:00 AM' },
    updatedBy: { type: String, default: 'System Admin' },
  },
  {
    timestamps: true,
  }
);
