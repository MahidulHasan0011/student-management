import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import v1Router from './api/v1/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

//Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

//Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

//API routes
app.use('/api/v1', v1Router);

//404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

//Global error handler
app.use(errorMiddleware);

export default app;
