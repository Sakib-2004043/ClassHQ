import { SystemSettingsModel } from './models.ts';
import { isMongoConnected } from './connection.ts';

let memorySettings = {
  key: 'global_settings',
  startTime: '3:00 PM',
  endTime: '12:00 AM',
  updatedBy: 'Chief Governor (Admin)',
  updatedAt: new Date().toISOString(),
};

export async function getSystemSettingsDB() {
  if (isMongoConnected) {
    try {
      let settings = await (SystemSettingsModel as any)
        .findOne({ $or: [{ key: 'global_settings' }, { startTime: { $exists: true } }] })
        .lean();

      if (!settings) {
        // Fallback check if any settings document exists
        settings = await (SystemSettingsModel as any).findOne().lean();
      }

      if (!settings) {
        const created = await (SystemSettingsModel as any).create({
          key: 'global_settings',
          startTime: '3:00 PM',
          endTime: '12:00 AM',
          updatedBy: 'Chief Governor (Admin)',
        });
        settings = created.toObject ? created.toObject() : created;
      }

      if (settings) {
        const result = {
          _id: settings._id ? String(settings._id) : undefined,
          key: settings.key || 'global_settings',
          startTime: settings.startTime || '3:00 PM',
          endTime: settings.endTime || '12:00 AM',
          updatedBy: settings.updatedBy || 'Chief Governor (Admin)',
          createdAt: settings.createdAt ? new Date(settings.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: settings.updatedAt ? new Date(settings.updatedAt).toISOString() : new Date().toISOString(),
        };
        memorySettings = result;
        return result;
      }
    } catch (err) {
      console.error('[DB Settings] Error reading settings from MongoDB:', err);
    }
  }
  return memorySettings;
}

export async function updateSystemSettingsDB(startTime: string, endTime: string, updatedBy: string) {
  memorySettings = {
    key: 'global_settings',
    startTime,
    endTime,
    updatedBy,
    updatedAt: new Date().toISOString(),
  };

  if (isMongoConnected) {
    try {
      const updated = await (SystemSettingsModel as any).findOneAndUpdate(
        { key: 'global_settings' },
        {
          startTime,
          endTime,
          updatedBy,
        },
        { upsert: true, new: true }
      );
      return {
        key: updated.key || 'global_settings',
        startTime: updated.startTime,
        endTime: updated.endTime,
        updatedBy: updated.updatedBy,
        updatedAt: updated.updatedAt ? new Date(updated.updatedAt).toISOString() : new Date().toISOString(),
      };
    } catch (err) {
      console.error('[DB Settings] Error writing settings to MongoDB:', err);
    }
  }
  return memorySettings;
}
