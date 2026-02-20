// ============================================
// auth.controller.js - Authentication Logic
// ============================================
// This controller handles user registration and
// login. It validates inputs, hashes passwords,
// checks for duplicates, and generates JWTs.
// ============================================

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ============================================
// In-Memory User Storage
// ============================================
// In a real application, this would be a database.
// Each user object has: id, username, email, password (hashed)
const users = [];

// BUG FIX: Use an auto-incrementing counter instead of users.length + 1.
// users.length + 1 can produce duplicate IDs if users are ever removed.
let nextUserId = 1;

// Bcrypt salt rounds - higher = more secure but slower
// 12 is a good balance for production use
const SALT_ROUNDS = 12;

// ============================================
// Helper: Validate Email Format
// ============================================
// Uses a regex pattern to check for basic email structure:
// something@something.something
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// ============================================
// Helper: Generate JWT Token
// ============================================
// Creates a signed JWT containing the user's id and username.
// The secret and expiration are read from environment variables.
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '1h'
        }
    );
};

// ============================================
// POST /register - Register a New User
// ============================================
// Expected body: { username, email, password }
// Returns: success message with user details
const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // ----- Input Validation -----

        // Check that all required fields are provided
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required (username, email, password)'
            });
        }

        // BUG FIX: Type-check inputs before calling .trim()
        // A malicious client could send { username: 123 }, which would
        // cause .trim() to throw a TypeError and crash the server.
        if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'All fields must be strings'
            });
        }

        // Trim and normalize inputs
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim().toLowerCase();

        // Validate username length (3-30 characters)
        if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
            return res.status(400).json({
                success: false,
                message: 'Username must be between 3 and 30 characters'
            });
        }

        // Validate email format using our helper
        if (!isValidEmail(trimmedEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Validate password length (minimum 6 characters)
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // ----- Check for Duplicate Users -----

        // Check if username already exists (case-insensitive)
        const existingUsername = users.find(
            (u) => u.username.toLowerCase() === trimmedUsername.toLowerCase()
        );
        if (existingUsername) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists. Please choose a different one.'
            });
        }

        // Check if email already exists
        const existingEmail = users.find((u) => u.email === trimmedEmail);
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }

        // ----- Create New User -----

        // Hash the password using bcrypt with salt rounds
        // This is an async operation, hence we use await
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Create the user object
        // BUG FIX: Use auto-incrementing counter for unique IDs
        const newUser = {
            id: nextUserId++,
            username: trimmedUsername,
            email: trimmedEmail,
            password: hashedPassword,   // Store ONLY the hashed password
            createdAt: new Date().toISOString()
        };

        // Add user to our in-memory store
        users.push(newUser);

        console.log(`[AUTH] ✅ User registered successfully: ${trimmedUsername} <${trimmedEmail}>`);

        // ----- Send Success Response -----
        // Never return the password hash in the response!
        return res.status(201).json({
            success: true,
            message: 'User registered successfully!',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                createdAt: newUser.createdAt
            }
        });

    } catch (error) {
        // Catch any unexpected errors (e.g., bcrypt failure)
        console.error('Registration Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during registration. Please try again.'
        });
    }
};

// ============================================
// POST /login - Login an Existing User
// ============================================
// Expected body: { email, password }
// Returns: JWT token on success
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // ----- Input Validation -----

        // Check that both fields are provided
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // BUG FIX: Type-check login inputs before calling string methods
        if (typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Email and password must be strings'
            });
        }

        const trimmedEmail = email.trim().toLowerCase();

        // Validate email format
        if (!isValidEmail(trimmedEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // ----- Find User -----

        // Search the in-memory users array for matching email
        const user = users.find((u) => u.email === trimmedEmail);

        // If user doesn't exist, return generic error
        // (don't reveal whether the email exists for security)
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // ----- Verify Password -----

        // Compare the provided password with the stored hash
        // bcrypt.compare is async and handles salt extraction internally
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            // Same generic error message (don't reveal which field is wrong)
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // ----- Generate JWT Token -----

        const token = generateToken(user);

        console.log(`[AUTH] 🔑 Login successful for user: ${user.username} (${user.email})`);

        // ----- Send Success Response -----
        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        // Catch any unexpected errors
        console.error('Login Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during login. Please try again.'
        });
    }
};

// Export both handler functions
module.exports = { register, login };
