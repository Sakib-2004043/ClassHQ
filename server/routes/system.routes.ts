import { Router, Response } from 'express';
import { getDatabaseStatus, getSystemSettingsDB } from '../db/index.ts';

export const systemRouter = Router();

// Health Check
systemRouter.get('/health', (req, res: Response) => {
  res.json({
    status: 'ok',
    app: 'ClassHQ Academic Attendance & Leave Management',
    time: new Date().toISOString(),
  });
});

// Database & System Status
systemRouter.get('/system/status', async (req, res: Response) => {
  try {
    const status = await getDatabaseStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error fetching system status' });
  }
});

// General Settings Access (available to all logged-in roles)
systemRouter.get(['/settings', '/system/settings'], async (req, res: Response) => {
  try {
    const settings = await getSystemSettingsDB();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});
