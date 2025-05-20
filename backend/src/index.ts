import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import config from './config';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { attachDatabaseUser } from './middlewares/clerk.middleware';

// Initialize Express app
const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Health check route (before auth)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  
  if (req.method === 'POST') {
    console.log('POST Request Body:', req.body);
  }
  
  // Log the response status
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`Response Status for ${req.method} ${req.url}: ${res.statusCode}`);
    return originalSend.call(this, body);
  };
  
  next();
});

// Clerk authentication middleware
app.use((req, res, next) => {
  // Skip auth for OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }
  return ClerkExpressWithAuth()(req, res, next);
});
app.use(attachDatabaseUser);

// Routes - using the combined router from routes/index.ts
app.use('/api', apiRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  console.log(`Server allows CORS from origin: *`);
});

export default app;
