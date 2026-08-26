import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

import { initMongoDB, isMongoConnected } from './server/db/index.ts';
import { authMiddleware } from './server/auth.ts';
import { authRouter } from './server/routes/auth.routes.ts';
import { studentRouter } from './server/routes/student.routes.ts';
import { captainRouter } from './server/routes/captain.routes.ts';
import { adminRouter } from './server/routes/admin.routes.ts';
import { systemRouter } from './server/routes/system.routes.ts';

dotenv.config();

export const app = express();
const PORT = 3000;

// Initialize MongoDB in background without blocking server boot
initMongoDB().catch((err) => console.error('[ClassHQ] MongoDB init error:', err));

// Global Middlewares
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(authMiddleware);

// Middleware to ensure DB connection readiness on serverless or cold starts
app.use(async (req, res, next) => {
  if (process.env.MONGO_URI || process.env.MONGODB_URI) {
    if (!isMongoConnected) {
      try {
        await initMongoDB();
      } catch (err) {
        console.error('[ClassHQ] MongoDB cold start connect error:', err);
      }
    }
  }
  next();
});

// Primary Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'ClassHQ Academic Attendance & Leave Management',
    time: new Date().toISOString(),
  });
});

// Mount Modular API Routers
app.use('/api', systemRouter);
app.use('/api/auth', authRouter);
app.use('/api/student', studentRouter);
app.use('/api/captain', captainRouter);
app.use('/api/admin', adminRouter);

// Vite Middleware & SPA Fallback Handler
export async function startServer() {
  const distPath = path.resolve(process.cwd(), 'dist');
  const hasBuiltAssets = fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' || hasBuiltAssets) {
    // In production or when built assets exist, serve static assets from dist/
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('ClassHQ Backend is active.');
      }
    });
  } else {
    // In development mode, attach Vite dev server middleware
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('[ClassHQ] Vite middleware note:', viteErr);
    }
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[ClassHQ Server Error]', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error', message: err?.message || 'Unknown error' });
    }
  });

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ClassHQ Server] Running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown on Cloud Run container lifecycle signals
  process.on('SIGTERM', () => {
    console.log('[ClassHQ Server] Received SIGTERM, closing gracefully...');
    server.close(() => {
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('[ClassHQ Server] Received SIGINT, closing gracefully...');
    server.close(() => {
      process.exit(0);
    });
  });
}

startServer();

export default app;
