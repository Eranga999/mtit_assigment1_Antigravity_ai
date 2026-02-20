# 🔐 SecureAuth — JWT Authentication System

A secure authentication system built with **Node.js/Express** (backend) and **HTML/CSS/JavaScript** (frontend), designed for learning purposes.

---

## 📁 Project Structure

```
mtit assignment 1/
├── backend/
│   ├── controllers/
│   │   └── auth.controller.js   # Registration & login logic
│   ├── routes/
│   │   └── auth.routes.js       # API route definitions
│   ├── .env                     # Environment variables (secrets)
│   ├── .env.example             # Example env file
│   ├── package.json             # Dependencies and scripts
│   └── server.js                # Express server entry point
├── frontend/
│   ├── index.html               # Main HTML page
│   ├── styles.css               # UI styles (dark theme)
│   └── app.js                   # Client-side JavaScript
└── README.md                    # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher) — [Download here](https://nodejs.org/)
- A modern web browser (Chrome, Firefox, Edge, etc.)

### Step 1: Install Backend Dependencies

Open a terminal in the project root and run:

```bash
cd backend
npm install
```

This installs: `express`, `bcrypt`, `jsonwebtoken`, `cors`, `dotenv`, `express-rate-limit`

### Step 2: Start the Backend Server

```bash
cd backend
npm start
```

You should see:
```
🔐 Auth Server running on http://localhost:3000
📋 Register: POST http://localhost:3000/api/auth/register
📋 Login:    POST http://localhost:3000/api/auth/login
```

### Step 3: Open the Frontend

Simply open the `frontend/index.html` file in your web browser:
- **Windows**: Double-click the file, or right-click → Open with → Your browser
- **Or** use VS Code's Live Server extension

> ⚠️ Make sure the backend server is running on port 3000 before using the frontend.

---

## 📋 API Endpoints

### `POST /api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully!",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### `POST /api/auth/login`

Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "secure123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful!",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

---

## 🔒 Security Features

| Feature                  | Description                                    |
|--------------------------|------------------------------------------------|
| bcrypt Password Hashing  | Passwords hashed with 12 salt rounds           |
| JWT Authentication       | Signed tokens with configurable expiration     |
| Input Validation         | Server-side validation on all fields           |
| Rate Limiting            | 20 requests per 15 mins per IP                 |
| CORS Protection          | Controlled cross-origin access                 |
| Environment Variables    | Secrets stored in `.env`, not in code          |
| Generic Error Messages   | Login errors don't reveal which field is wrong |

---

## ⚙️ Environment Variables

| Variable        | Default                | Description          |
|-----------------|------------------------|----------------------|
| `JWT_SECRET`    | *(set in .env)*        | Secret for signing   |
| `JWT_EXPIRES_IN`| `1h`                   | Token lifetime       |
| `PORT`          | `3000`                 | Server port          |

---

## 📝 Notes

- Users are stored **in-memory** (array). Data resets when the server restarts.
- This project is for **learning purposes**. For production, use a real database, HTTPS, and additional security measures.
- The frontend communicates with `http://localhost:3000`. Update `API_BASE_URL` in `app.js` if your backend runs on a different port.
