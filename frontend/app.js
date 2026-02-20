// ============================================
// app.js - Frontend Authentication Logic
// ============================================
// This file handles form switching, client-side
// validation, API calls (register/login), and
// displaying results including the JWT token.
// ============================================

// ============================================
// Configuration
// ============================================
// Base URL of the backend API server
const API_BASE_URL = 'http://localhost:3000/api/auth';

// ============================================
// DOM Element References
// ============================================
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const tabIndicator = document.getElementById('tabIndicator');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const messageContainer = document.getElementById('messageContainer');
const tokenDisplay = document.getElementById('tokenDisplay');
const tokenValue = document.getElementById('tokenValue');
const registerPassword = document.getElementById('registerPassword');

// ============================================
// Form Switching Logic
// ============================================
// Switches between Login and Register forms
// without reloading the page
function switchForm(formType) {
    // Clear any previous messages and token display
    clearMessage();
    tokenDisplay.style.display = 'none';

    if (formType === 'login') {
        // Show login form, hide register form
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        tabIndicator.classList.remove('right');

        // Update the header text
        authTitle.textContent = 'Welcome Back';
        authSubtitle.textContent = 'Sign in to your account to continue';
    } else {
        // Show register form, hide login form
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        tabIndicator.classList.add('right');

        // Update the header text
        authTitle.textContent = 'Create Account';
        authSubtitle.textContent = 'Sign up to get started with your account';
    }
}

// ============================================
// Password Visibility Toggle
// ============================================
// Toggles between showing/hiding the password text
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const eyeOpen = button.querySelector('.eye-open');
    const eyeClosed = button.querySelector('.eye-closed');

    if (input.type === 'password') {
        input.type = 'text';
        eyeOpen.style.display = 'none';
        eyeClosed.style.display = 'block';
    } else {
        input.type = 'password';
        eyeOpen.style.display = 'block';
        eyeClosed.style.display = 'none';
    }
}

// ============================================
// Password Strength Indicator
// ============================================
// Updates the visual strength bar as the user types
registerPassword.addEventListener('input', (e) => {
    const password = e.target.value;
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    // Calculate a simple strength score (0-4)
    let score = 0;
    if (password.length >= 6) score++;       // Minimum length met
    if (password.length >= 10) score++;      // Good length
    if (/[A-Z]/.test(password)) score++;     // Has uppercase
    if (/[0-9]/.test(password)) score++;     // Has numbers
    if (/[^A-Za-z0-9]/.test(password)) score++; // Has special characters

    // Map score to visual representation
    const strengthMap = {
        0: { width: '0%', color: 'transparent', text: '' },
        1: { width: '20%', color: '#ef4444', text: 'Very weak' },
        2: { width: '40%', color: '#f97316', text: 'Weak' },
        3: { width: '60%', color: '#eab308', text: 'Fair' },
        4: { width: '80%', color: '#22c55e', text: 'Strong' },
        5: { width: '100%', color: '#10b981', text: 'Very strong' }
    };

    const strength = strengthMap[score];
    strengthBar.style.width = strength.width;
    strengthBar.style.background = strength.color;
    strengthText.textContent = strength.text;
    strengthText.style.color = strength.color;
});

// ============================================
// Message Display Functions
// ============================================

// BUG FIX: Track the auto-clear timer so that rapid successive
// calls to showMessage() don't cause a stale timer to clear
// a newer message prematurely.
let messageClearTimer = null;

/**
 * Shows a success or error message in the UI
 * BUG FIX: Uses textContent instead of innerHTML for the message
 * text to prevent XSS if the server returns HTML in error messages.
 * @param {string} text - The message text
 * @param {string} type - 'success' or 'error'
 */
function showMessage(text, type) {
    // Clear any existing auto-dismiss timer
    if (messageClearTimer) {
        clearTimeout(messageClearTimer);
        messageClearTimer = null;
    }

    // Build the message DOM safely (no raw HTML injection)
    const wrapper = document.createElement('div');
    wrapper.className = `message ${type}`;

    // Create the SVG icon based on message type
    const iconSvg = type === 'success'
        ? '<svg class="message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
        : '<svg class="message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';

    // Icon is static/trusted markup, so innerHTML is safe here
    const iconContainer = document.createElement('span');
    iconContainer.innerHTML = iconSvg;

    // BUG FIX (XSS): Use textContent for user/server-supplied text
    const span = document.createElement('span');
    span.textContent = text;

    wrapper.appendChild(iconContainer.firstChild);
    wrapper.appendChild(span);

    messageContainer.innerHTML = '';
    messageContainer.appendChild(wrapper);

    // Auto-clear message after 6 seconds
    messageClearTimer = setTimeout(clearMessage, 6000);
}

/**
 * Clears the message display area
 */
function clearMessage() {
    messageContainer.innerHTML = '';
    if (messageClearTimer) {
        clearTimeout(messageClearTimer);
        messageClearTimer = null;
    }
}

// ============================================
// Loading State Management
// ============================================

/**
 * Toggles the loading state on a submit button
 * @param {HTMLElement} button - The submit button element
 * @param {boolean} isLoading - Whether to show loading state
 */
function setLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');

    if (isLoading) {
        button.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'flex';
    } else {
        button.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

// ============================================
// Client-Side Validation
// ============================================

/**
 * Validates email format using a simple regex
 * @param {string} email - The email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ============================================
// API Communication Functions
// ============================================

/**
 * Sends a POST request to the backend API
 * Uses fetch with async/await and proper error handling
 * @param {string} endpoint - The API endpoint (e.g. '/register')
 * @param {object} data - The request body data
 * @returns {object} The parsed JSON response
 */
async function apiRequest(endpoint, data) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        // Parse the JSON response
        const result = await response.json();

        // If the HTTP status indicates an error, throw with the server's message
        if (!response.ok) {
            throw new Error(result.message || `Request failed with status ${response.status}`);
        }

        return result;
    } catch (error) {
        // Re-throw network errors or parsed errors
        if (error.message === 'Failed to fetch') {
            throw new Error('Unable to connect to the server. Is the backend running on port 3000?');
        }
        throw error;
    }
}

// ============================================
// Form Handlers
// ============================================

/**
 * Handles the login form submission
 * Validates inputs, sends request, and displays the JWT token
 */
async function handleLogin(event) {
    // Prevent default form submission (page reload)
    event.preventDefault();
    clearMessage();
    tokenDisplay.style.display = 'none';

    // Get input values
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.getElementById('loginBtn');

    // ----- Client-side Validation -----

    // Check for empty fields
    if (!email || !password) {
        showMessage('Please fill in all fields.', 'error');
        return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
    }

    // ----- Send Login Request -----
    try {
        // Enable loading state (disables button, shows spinner)
        setLoading(submitBtn, true);

        // Make the API request
        const result = await apiRequest('/login', { email, password });

        // Show success message
        showMessage(`Welcome back, ${result.user.username}! Login successful.`, 'success');

        // Display the JWT token
        tokenValue.textContent = result.token;
        tokenDisplay.style.display = 'block';

        // Scroll to show the token
        tokenDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        // Display the error message from the server or network
        showMessage(error.message, 'error');
    } finally {
        // Always reset loading state, even if an error occurred
        setLoading(submitBtn, false);
    }
}

/**
 * Handles the registration form submission
 * Validates inputs, sends request, and switches to login on success
 */
async function handleRegister(event) {
    // Prevent default form submission (page reload)
    event.preventDefault();
    clearMessage();

    // Get input values
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const submitBtn = document.getElementById('registerBtn');

    // ----- Client-side Validation -----

    // Check for empty fields
    if (!username || !email || !password || !confirmPassword) {
        showMessage('Please fill in all fields.', 'error');
        return;
    }

    // Validate username length
    if (username.length < 3) {
        showMessage('Username must be at least 3 characters long.', 'error');
        return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
    }

    // Validate password length
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long.', 'error');
        return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        showMessage('Passwords do not match.', 'error');
        return;
    }

    // ----- Send Registration Request -----
    try {
        // Enable loading state (disables button, shows spinner)
        setLoading(submitBtn, true);

        // Make the API request
        const result = await apiRequest('/register', { username, email, password });

        // Show success message
        showMessage('Account created successfully! You can now sign in.', 'success');

        // Clear the registration form
        registerForm.reset();

        // Reset password strength indicator
        document.getElementById('strengthBar').style.width = '0%';
        document.getElementById('strengthText').textContent = '';

        // Automatically switch to login form after 1.5 seconds
        // so the user can immediately log in
        setTimeout(() => {
            switchForm('login');
            // Pre-fill the email field for convenience
            document.getElementById('loginEmail').value = email;
        }, 1500);

    } catch (error) {
        // Display the error message from the server or network
        showMessage(error.message, 'error');
    } finally {
        // Always reset loading state
        setLoading(submitBtn, false);
    }
}

// ============================================
// Copy Token to Clipboard
// ============================================
async function copyToken() {
    const token = tokenValue.textContent;
    const copyBtn = document.getElementById('copyBtn');

    try {
        // Use the Clipboard API to copy the token
        await navigator.clipboard.writeText(token);

        // Visual feedback: change button icon to a checkmark
        copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>';

        // Reset the button icon after 2 seconds
        setTimeout(() => {
            copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        }, 2000);

    } catch (err) {
        // Fallback for older browsers
        showMessage('Failed to copy token. Please select and copy manually.', 'error');
    }
}

// ============================================
// Initialization & Real-time Listeners
// ============================================

// ============================================
// Logout Handler
// ============================================
function handleLogout() {
    // Hide the token display
    tokenDisplay.style.display = 'none';
    tokenValue.textContent = '';

    // Clear message and show logout success
    clearMessage();
    showMessage('Logged out successfully.', 'success');

    // Reset forms and switch back to login tab
    loginForm.reset();
    registerForm.reset();
    switchForm('login');

    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Add real-time email validation feedback
const emailInputs = ['loginEmail', 'registerEmail'];
emailInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
        input.addEventListener('input', () => {
            const wrapper = input.closest('.input-wrapper');
            if (input.value.length > 0 && !isValidEmail(input.value)) {
                wrapper.classList.add('invalid');
            } else {
                wrapper.classList.remove('invalid');
            }
        });
    }
});

// Log a friendly message when the app loads
console.log('🔐 SecureAuth Frontend loaded');
console.log('📡 API Base URL:', API_BASE_URL);

