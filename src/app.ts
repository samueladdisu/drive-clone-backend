import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import userRoutes from './routes/userRoutes';
import fileRoutes from './routes/fileRoutes';
import folderRoutes from './routes/folderRoutes';

// Middlewares
import { errorHandler } from './middlewares/errorHandler';
import config from './config/config';

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (config.nodeEnv === 'production') {
        if (
          origin.startsWith('https://') ||
          config.cors.origin.includes(origin)
        ) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      }

      if (config.cors.origin.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: config.cors.credentials,
    methods: '*',
    allowedHeaders: '*',
  }),
);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Error handling middleware
app.use(errorHandler);

export default app;
