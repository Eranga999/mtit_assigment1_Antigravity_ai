// ============================================
// server.js - Main Entry Point for Auth Backend
// ============================================
// This file initializes the Express server, loads
// environment variables, applies middleware, and
// mounts the authentication routes.
// ============================================

// Load environment variables from .env file FIRST
// so all modules can access process.env values
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth.routes');

// ============================================
// Startup Guard: Ensure JWT_SECRET is defined
// ============================================
// BUG FIX: Without this check, jwt.sign() would silently
// use `undefined` as the secret, producing insecure tokens.
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET is not defined in environment variables.');
  console.error('   Create a .env file in the backend directory with JWT_SECRET=your_secret');
  process.exit(1);
}

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Global Middleware
// ============================================

// Simple Request Logger Middleware
// This logs EVERY incoming request with a timestamp, method, and URL.
// Useful for debugging and monitoring traffic.
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Helmet sets various HTTP security headers automatically
// (X-Content-Type-Options, Strict-Transport-Security, etc.)
app.use(helmet());

// Enable CORS so the frontend (running on a different port/origin)
// can communicate with this backend API
app.use(cors({
  origin: '*',               // Allow all origins (restrict in production)
  methods: ['GET', 'POST'],  // Only allow GET and POST methods
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse incoming JSON request bodies
// This allows us to access req.body in our routes
app.use(express.json({ limit: '10kb' })); // Limit body size for security

// Rate limiter to prevent brute-force attacks
// Limits each IP to 20 requests per 15-minute window
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 20,                     // Max 20 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,       // Return rate limit info in headers
  legacyHeaders: false
});

// Apply rate limiter to all /api/auth routes
app.use('/api/auth', limiter);

// ============================================
// Routes
// ============================================

// Mount authentication routes under /api/auth
// POST /api/auth/register - Register a new user
// POST /api/auth/login    - Login an existing user
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API is running',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login'
    }
  });
});

// ============================================
// 404 Handler - Catch undefined routes
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// ============================================
// Global Error Handler
// ============================================
// Express requires exactly 4 parameters to recognise this
// as an error-handling middleware. We use _next to signal
// that the parameter is intentionally unused.
// BUG FIX: Also log the full stack trace for easier debugging.
app.use((err, req, res, _next) => {
  console.error('Unhandled Error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: 'Internal server error'
  });
});

// ============================================
// Start Server
// ============================================
const server = app.listen(PORT, () => {
  console.log(`\n🔐 Auth Server running on http://localhost:${PORT}`);
  console.log(`📋 Register: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`📋 Login:    POST http://localhost:${PORT}/api/auth/login\n`);
});

// ============================================
// Graceful Shutdown Logic
// ============================================
// Ensures the server stops accepting new connections 
// and cleans up before exiting.
const shutdown = () => {
  console.log('\n🛑 Received kill signal, shutting down gracefully...');
  server.close(() => {
    console.log('🏁 Closed out remaining connections.');
    process.exit(0);
  });

  // If server hasn't finished in 10s, force shutdown
  setTimeout(() => {
    console.error('⚠️ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
