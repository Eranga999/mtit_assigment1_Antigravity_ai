# SecureAuth — Project Documentation

> **Stack:** Node.js · Express · bcrypt · JWT (Backend) | HTML · CSS · Vanilla JS (Frontend)  
> **Purpose:** A learning-focused full-stack JWT authentication system  
> **Date:** 2026-02-18

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Project Structure](#2-project-structure)
3. [Technology Stack](#3-technology-stack)
4. [Setup & Running](#4-setup--running)
5. [Environment Variables](#5-environment-variables)
6. [Backend Documentation](#6-backend-documentation)
7. [API Reference](#7-api-reference)
8. [Frontend Documentation](#8-frontend-documentation)
9. [Data Flow](#9-data-flow)
10. [Validation Rules](#10-validation-rules)
11. [Security Features](#11-security-features)
12. [Bugs Fixed](#12-bugs-fixed)
13. [Known Limitations](#13-known-limitations)

---

## 1. Project Overview

SecureAuth demonstrates core real-world authentication concepts:

- User **registration** with input validation and duplicate prevention
- **Password hashing** using bcrypt (plain-text passwords are never stored)
- **JWT token** generation on login for stateless authentication
- **Rate limiting** and **security headers** to harden the API
- A **modern dark-themed frontend** that communicates via the `fetch` API
- Users are stored in an **in-memory array** (no database setup needed)

---

## 2. Project Structure

```
mtit assigemnt 1/
├── README.md
├── DEBUG_REPORT.md
├── AIdocumentation.md              ← This file
├── backend/
│   ├── .env                        ← Secret environment variables
│   ├── .env.example                ← Template for env vars
│   ├── package.json                ← Dependencies & scripts
│   ├── server.js                   ← Entry point: middleware + server start
│   ├── routes/
│   │   └── auth.routes.js          ← Route definitions
│   └── controllers/
│       └── auth.controller.js      ← Registration & login logic
└── frontend/
    ├── index.html                  ← Single-page UI
    ├── styles.css                  ← Dark glassmorphic design
    └── app.js                      ← Client-side logic
```

---

## 3. Technology Stack

### Backend Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web framework — routing and middleware |
| `bcrypt` | Password hashing with salt rounds |
| `jsonwebtoken` | JWT creation and verification |
| `dotenv` | Loads `.env` into `process.env` |
| `cors` | Cross-origin request handling |
| `helmet` | Secure HTTP response headers |
| `express-rate-limit` | Brute-force request throttling |

### Frontend

- **HTML5** — semantic structure with accessible forms
- **CSS3** — custom properties, animations, glassmorphism
- **Vanilla JavaScript** — `fetch` API, `async/await`, DOM manipulation
- **Google Fonts (Inter)** — modern typography

---

## 4. Setup & Running

### Prerequisites

- Node.js v16+ — [nodejs.org](https://nodejs.org/)
- A modern browser (Chrome, Firefox, Edge)

### Steps

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Start the server
npm start
# Output: 🔐 Auth Server running on http://localhost:3000

# 3. Open frontend
# Open frontend/index.html in your browser (double-click or Live Server)
```

> ⚠️ The backend must be running before the frontend can make API calls.

---

## 5. Environment Variables

Stored in `backend/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | _(required)_ | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | `1h` | Token lifetime (`1h`, `7d`, `30m`) |
| `PORT` | `3000` | Server port |

> The server **refuses to start** if `JWT_SECRET` is missing.

---

## 6. Backend Documentation

### 6.1 `server.js` — Entry Point

**Startup sequence:**
1. Loads `.env` variables via `dotenv`
2. Guards against missing `JWT_SECRET` (exits with error if absent)
3. Registers middleware in order:
   - `helmet()` → security headers
   - `cors()` → cross-origin access
   - `express.json({ limit: '10kb' })` → JSON body parsing
   - `rateLimit` → 20 requests / 15 min per IP on `/api/auth`
4. Mounts auth routes at `/api/auth`
5. Registers 404 catch-all and global error handler
6. Starts listening on configured port

### 6.2 `auth.routes.js` — Routes

Maps two endpoints to controller functions:

```
POST /api/auth/register  →  controller.register()
POST /api/auth/login     →  controller.login()
```

### 6.3 `auth.controller.js` — Core Logic

**Module-level state:**
- `users = []` — in-memory user store
- `nextUserId = 1` — auto-incrementing ID counter
- `SALT_ROUNDS = 12` — bcrypt work factor

**Helper functions:**
- `isValidEmail(email)` — regex check for basic `x@y.z` format
- `generateToken(user)` — creates a signed JWT with `{ id, username, email }` payload

**`register(req, res)`** pipeline:
1. Check all fields present → 400
2. Type-check all fields are strings → 400
3. Trim whitespace, lowercase email
4. Validate username length (3–30) → 400
5. Validate email format → 400
6. Validate password length (≥6) → 400
7. Check username uniqueness (case-insensitive) → 409
8. Check email uniqueness → 409
9. Hash password with bcrypt → `await`
10. Create user, push to array → 201 response

**`login(req, res)`** pipeline:
1. Check fields present → 400
2. Type-check strings → 400
3. Validate email format → 400
4. Find user by email → 401 (generic message)
5. Compare password hash with bcrypt → 401 (same generic message)
6. Generate JWT → 200 response with token

> Login uses the **same error message** for "email not found" and "wrong password" to prevent email enumeration.

---

## 7. API Reference

### `POST /api/auth/register`

**Request:**
```json
{ "username": "john_doe", "email": "john@example.com", "password": "SecurePass@123" }
```

**Success (201):**
```json
{
  "success": true,
  "message": "User registered successfully!",
  "user": { "id": 1, "username": "john_doe", "email": "john@example.com", "createdAt": "..." }
}
```

**Errors:** `400` (validation), `409` (duplicate), `429` (rate limit), `500` (server error)

---

### `POST /api/auth/login`

**Request:**
```json
{ "email": "john@example.com", "password": "SecurePass@123" }
```

**Success (200):**
```json
{
  "success": true,
  "message": "Login successful!",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "username": "john_doe", "email": "john@example.com" }
}
```

**Errors:** `400` (validation), `401` (wrong credentials), `429` (rate limit), `500` (server error)

---

### `GET /` — Health Check

Returns `{ "success": true, "message": "Auth API is running" }` with available endpoints.

### Response Format

All responses follow: `{ "success": true/false, "message": "...", ...data }`.

---

## 8. Frontend Documentation

### 8.1 `index.html` — Page Structure

| Section | Description |
|---------|-------------|
| Background orbs | Three animated blurred circles (decorative) |
| Auth card | Centered glassmorphic container |
| Tab switcher | "Sign In" / "Create Account" with sliding indicator |
| Login form | Email + password inputs with eye-toggle |
| Register form | Username + email + password with strength indicator |
| Message area | Dynamically shows success/error banners |
| Token display | Shows JWT after successful login with copy button |

### 8.2 `styles.css` — Design System

**Design tokens** (CSS custom properties on `:root`):
- Colors: Indigo/violet primary (`#6366f1`), dark backgrounds (`#0a0a1a`)
- Text: white primary, slate secondary, gray muted
- Status: green for success, red for error
- Radii: `8px` (inputs), `12px` (cards), `20px` (main container)

**Key animations:**
- `slideUp` — card entry animation
- `fadeIn` — form switch transition
- `floatOrb` / `floatOrbCenter` — background orb movement
- `spin` — loading spinner rotation
- `pulse-glow` — logo glow effect

**Responsive:** `@media (max-width: 480px)` reduces padding and dims orbs.

### 8.3 `app.js` — Client Logic

**Key functions:**

| Function | Purpose |
|----------|---------|
| `switchForm(type)` | Toggles between login/register without reload |
| `togglePassword(id, btn)` | Shows/hides password text |
| `showMessage(text, type)` | Displays success/error banner (XSS-safe via `textContent`) |
| `clearMessage()` | Removes the message banner |
| `setLoading(btn, bool)` | Disables button and shows spinner during requests |
| `isValidEmail(email)` | Client-side email format check |
| `apiRequest(endpoint, data)` | Central `fetch` wrapper with error handling |
| `handleLogin(event)` | Validates → calls API → shows token on success |
| `handleRegister(event)` | Validates → calls API → switches to login on success |
| `copyToken()` | Copies JWT to clipboard via `navigator.clipboard` |

**Password strength scoring** (0–5 points):
- ≥6 chars (+1), ≥10 chars (+1), uppercase (+1), digit (+1), special char (+1)
- Maps to: Very weak → Weak → Fair → Strong → Very strong

---

## 9. Data Flow

### Registration

```
Frontend validates → POST /register → Backend validates → bcrypt.hash()
→ Store user → 201 response → Show success → Switch to login tab
```

### Login

```
Frontend validates → POST /login → Backend validates → bcrypt.compare()
→ jwt.sign() → 200 response with token → Display JWT on page
```

---

## 10. Validation Rules

| Field | Backend Rule | Frontend Rule |
|-------|-------------|---------------|
| All fields | Must be present & type `string` | Must not be empty |
| `username` | 3–30 characters, unique (case-insensitive) | ≥3 characters |
| `email` | Valid format, unique | Valid format |
| `password` | ≥6 characters | ≥6 characters |

> Backend validation is **authoritative**. Frontend validation is for UX only.

---

## 11. Security Features

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcrypt, 12 salt rounds |
| JWT tokens | HS256 algorithm, configurable expiry, env-based secret |
| Startup guard | Server exits if `JWT_SECRET` is undefined |
| Rate limiting | 20 requests / 15 min per IP on auth routes |
| Security headers | Helmet (X-Content-Type-Options, X-Frame-Options, HSTS, etc.) |
| Body size limit | JSON payloads capped at 10kb |
| XSS prevention | Frontend uses `textContent` for server messages |
| Input type-checking | Backend guards against non-string inputs |
| Generic login errors | Same message for wrong email and wrong password |
| CORS | Configured with allowed methods and headers |

---

## 12. Bugs Fixed

| # | Severity | File | Issue | Fix |
|---|----------|------|-------|-----|
| 1 | 🔴 Critical | `server.js` | No JWT_SECRET check — tokens signed with `undefined` | Startup guard with `process.exit(1)` |
| 2 | 🔴 Critical | `app.js` | XSS via `innerHTML` in message display | Switched to `textContent` |
| 3 | 🟠 High | `auth.controller.js` | `.trim()` crash on non-string inputs | Added type-checking guards |
| 4 | 🟡 Medium | `auth.controller.js` | `users.length + 1` can produce duplicate IDs | Auto-incrementing `nextUserId` counter |
| 5 | 🟡 Medium | `app.js` | Stacked `setTimeout` timers clear newer messages | Track and cancel timer before setting new one |
| 6 | 🟡 Medium | `styles.css` | Orb-3 animation overrides centering transform | Dedicated `floatOrbCenter` keyframe |
| 7 | 🔵 Low | `server.js` | Missing security headers, weak error logging | Added Helmet, log full stack trace |

> See `DEBUG_REPORT.md` for full details on each fix.

---

## 13. Known Limitations

| Area | Current (Learning) | Production Recommendation |
|------|-------------------|--------------------------|
| Storage | In-memory array (lost on restart) | PostgreSQL, MongoDB |
| HTTPS | HTTP only | TLS certificates required |
| CORS | All origins allowed | Restrict to frontend domain |
| Token refresh | Not implemented | Refresh token rotation |
| Logout | Not implemented | Token blocklist |
| Password reset | Not implemented | Email-based reset flow |
| Tests | None | Jest unit + integration tests |
| Logging | `console.log` | Winston or Pino |

---

*End of Documentation*
