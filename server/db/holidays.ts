import mongoose from 'mongoose';
import { Holiday, HSCBatch, Section } from '../../src/types.ts';
import { memoryHolidays, isMongoConnected } from './connection.ts';
import { HolidayModel } from './models.ts';
import { compareBatch, compareSection } from './helpers.ts';

export function formatHolidayDoc(doc: any): Holiday {
  if (!doc) return doc;
  const id = doc.id || (doc._id ? doc._id.toString() : `holiday-${Date.now()}`);
  return {
    id,
    title: doc.title || 'Official Academic Holiday',
    batch: doc.batch as HSCBatch,
    section: doc.section as Section,
    startDate: doc.startDate,
    endDate: doc.endDate,
    description: doc.description || '',
    createdBy: {
      id: doc.createdBy?.id || '',
      name: doc.createdBy?.name || 'Class Captain',
      email: (doc.createdBy?.email || '').toLowerCase(),
      rollNumber: doc.createdBy?.rollNumber || '',
      role: doc.createdBy?.role || 'captain',
    },
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export async function getAllHolidays(): Promise<Holiday[]> {
  if (isMongoConnected) {
    try {
      const docs = await (HolidayModel as any).find().sort({ startDate: -1 }).lean();
      if (docs && docs.length > 0) {
        return docs.map(formatHolidayDoc);
      }
    } catch (err) {
      console.warn('[ClassHQ DB] Error fetching holidays from Mongo:', err);
    }
  }

  return [...memoryHolidays].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
}

export async function getHolidaysBySection(batch: string, section: string): Promise<Holiday[]> {
  if (isMongoConnected) {
    try {
      const allDocs = await (HolidayModel as any).find().sort({ startDate: -1 }).lean();
      const filtered = (allDocs || [])
        .map(formatHolidayDoc)
        .filter((h: Holiday) => compareBatch(h.batch, batch) && compareSection(h.section, section));
      return filtered;
    } catch (err) {
      console.warn('[ClassHQ DB] Error querying holidays by section from Mongo:', err);
    }
  }

  return memoryHolidays
    .filter((h) => compareBatch(h.batch, batch) && compareSection(h.section, section))
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function getHolidayForDate(
  batch: string,
  section: string,
  dateStr: string
): Promise<Holiday | null> {
  const sectionHolidays = await getHolidaysBySection(batch, section);
  const found = sectionHolidays.find((h) => {
    return h.startDate <= dateStr && dateStr <= h.endDate;
  });
  return found || null;
}

export async function createHoliday(holidayData: {
  title: string;
  batch: HSCBatch;
  section: Section;
  startDate: string;
  endDate: string;
  description?: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    rollNumber?: string;
    role: any;
  };
}): Promise<Holiday> {
  const newId = `hol-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const item: Holiday = {
    id: newId,
    title: holidayData.title.trim(),
    batch: holidayData.batch,
    section: holidayData.section,
    startDate: holidayData.startDate,
    endDate: holidayData.endDate,
    description: (holidayData.description || '').trim(),
    createdBy: {
      id: holidayData.createdBy.id,
      name: holidayData.createdBy.name,
      email: holidayData.createdBy.email.toLowerCase(),
      rollNumber: holidayData.createdBy.rollNumber || '',
      role: holidayData.createdBy.role,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isMongoConnected) {
    try {
      const doc = await HolidayModel.create({
        ...item,
        _id: new mongoose.Types.ObjectId(),
      });
      return formatHolidayDoc(doc);
    } catch (err) {
      console.warn('[ClassHQ DB] Error saving holiday to MongoDB:', err);
    }
  }

  memoryHolidays.push(item);
  return item;
}

export async function findHolidayById(id: string): Promise<Holiday | null> {
  if (isMongoConnected) {
    try {
      const orConditions: any[] = [{ id }, { _id: id }];
      if (mongoose.Types.ObjectId.isValid(id)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }
      const doc = await (HolidayModel as any).findOne({ $or: orConditions }).lean();
      if (doc) return formatHolidayDoc(doc);
    } catch {
      // ignore
    }
  }

  const mem = memoryHolidays.find((h) => h.id === id || (h as any)._id === id);
  return mem ? { ...mem } : null;
}

export async function deleteHoliday(
  id: string,
  requester: { id: string; role: string; batch?: string; section?: string }
): Promise<boolean> {
  const existing = await findHolidayById(id);
  if (!existing) return false;

  // Authorization check: Captain can only delete their own section holiday, admin can delete any
  if (requester.role === 'captain') {
    const isSameSection =
      compareBatch(existing.batch, requester.batch) &&
      compareSection(existing.section, requester.section);
    if (!isSameSection) {
      throw new Error('Class Captain can only delete holidays for their own assigned section.');
    }
  }

  if (isMongoConnected) {
    try {
      const orConditions: any[] = [{ id }, { _id: id }];
      if (mongoose.Types.ObjectId.isValid(id)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }
      await (HolidayModel as any).deleteOne({ $or: orConditions });
    } catch (err) {
      console.warn('[ClassHQ DB] Error deleting holiday from MongoDB:', err);
    }
  }

  const index = memoryHolidays.findIndex((h) => h.id === id || (h as any)._id === id);
  if (index !== -1) {
    memoryHolidays.splice(index, 1);
  }

  return true;
}
