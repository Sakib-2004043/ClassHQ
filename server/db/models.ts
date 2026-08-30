import mongoose from 'mongoose';
import { UserSchema, AttendanceSchema, SystemSettingsSchema, HolidaySchema, AttendanceEditOverrideSchema } from './schema/index.ts';

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const AttendanceModel = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
export const SystemSettingsModel = mongoose.models.SystemSettings || mongoose.model('SystemSettings', SystemSettingsSchema);
export const HolidayModel = mongoose.models.Holiday || mongoose.model('Holiday', HolidaySchema);
export const AttendanceEditOverrideModel =
  mongoose.models.AttendanceEditOverride || mongoose.model('AttendanceEditOverride', AttendanceEditOverrideSchema);
