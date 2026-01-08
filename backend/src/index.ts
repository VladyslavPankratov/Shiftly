import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables BEFORE importing anything that uses them
dotenv.config();

import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import shiftRoutes from './routes/shift.routes';
import departmentRoutes from './routes/department.routes';

const app = express();

// Middleware
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/departments', departmentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Shiftly API is running' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

app.listen(env.PORT, () => {
  console.log(`🚀 Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});
