// ============================================
// auth.routes.js - Authentication Routes
// ============================================
// Defines the API endpoints for user registration
// and login. Each route maps to a controller function.
// ============================================

const express = require('express');
const router = express.Router();

// Import controller functions
const { register, login } = require('../controllers/auth.controller');

// ============================================
// Route Definitions
// ============================================

// POST /api/auth/register
// Registers a new user with username, email, and password
router.post('/register', register);

// POST /api/auth/login
// Authenticates a user and returns a JWT token
router.post('/login', login);

// Export the router to be mounted in server.js
module.exports = router;
