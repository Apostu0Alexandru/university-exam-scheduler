import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import config from './config';
import userRoutes from './routes/user.routes';
import studyResourceRoutes from './routes/studyResource.routes';
import recommendationRoutes from './routes/recommendation.routes';
import { errorHandler } from './middlewares/error.middleware';
import { attachDatabaseUser } from './middlewares/clerk.middleware';

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Clerk authentication middleware
app.use(ClerkExpressWithAuth());
app.use(attachDatabaseUser);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/study-resources', studyResourceRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
});

export default app;
