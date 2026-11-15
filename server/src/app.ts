import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/authRoutes.js';
import boardRoutes from './routes/boardRoutes.js';
import listRoutes from './routes/listRoutes.js';
import cardRoutes from './routes/cardRoutes.js';
import subRoutes from './routes/subRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { AppError, sendError } from './utils/errors.js';
import { uploadsDir } from './utils/upload.js';

export const app = express();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/users', userRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api', subRoutes);
app.use('/api/templates', templateRoutes);

// 404 Handler for undefined API routes
app.use('/api/*', (_req: Request, res: Response) => {
  sendError(res, 404, 'NOT_FOUND', 'Endpoint not found');
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }
  console.error('Unhandled server error:', err);
  return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred');
});

// Serve Frontend in Production (Single-service deployment)
  const clientDistCandidates = [
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(__dirname, '../../client/dist'),
  ];
  const clientDistPath = clientDistCandidates.find((p) => fs.existsSync(p));

  if (clientDistPath) {
    app.use(express.static(clientDistPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }
