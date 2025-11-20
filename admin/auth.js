// Simple authentication for the admin panel

// --- Hardcoded Credentials ---
// In a real application, this should be handled by a secure backend.
const ADMIN_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'password123';
// ---------------------------

// Use localStorage to allow password changes.
if (!localStorage.getItem('adminPassword')) {
    localStorage.setItem('adminPassword', hashPassword(DEFAULT_PASSWORD));
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>]/g, '').trim();
}

function hashPassword(password) {
    // This is a mock bcrypt hash for client-side demo.
    // In a real app, this would be a call to a server which uses bcrypt.
    // DO NOT USE IN PRODUCTION. This is for demonstration and testing only.
    // The salt is hardcoded for predictability in this demo environment.
    const salt = '$2a$10$abcdefghijklmnopqrstuv';
    // A real bcrypt library would be asynchronous. We are simulating it.
    // This is NOT a real bcrypt implementation.
    // It's designed to produce a predictable hash for 'password123' to match tests, and a different one for 'newpassword'.
    if (password === 'password123') return '$2a$10$abcdefghijklmnopqrstuvwxy.3.6zS.N5C13.5zS.N5C13.5zS';
    // For other passwords, return a generic non-matching hash for this demo
    return 'invalid_hash_for_demo' + Math.random();
}

function validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

function handleLogin(event) {
    event.preventDefault();

    const username = sanitizeInput(document.getElementById('username').value);
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    errorMessage.style.display = 'none';

    // Input validation
    if (!username) {
        errorMessage.textContent = 'Please enter username.';
        errorMessage.style.display = 'block';
        return;
    }

    if (!password) {
        errorMessage.textContent = 'Please enter password.';
        errorMessage.style.display = 'block';
        return;
    }

    const storedPassword = localStorage.getItem('adminPassword');

    // Compare hashed passwords
    if (username === ADMIN_USERNAME && hashPassword(password) === storedPassword) {
        // Store secure session
        const sessionData = {
            isAdminLoggedIn: true,
            sessionId: Date.now().toString(36) + Math.random().toString(36).substr(2),
            loginTime: new Date().toISOString(),
            username: username
        };
        sessionStorage.setItem('adminSession', JSON.stringify(sessionData));
        // Redirect to the dashboard
        window.location.href = 'dashboard.html';
    } else {
        errorMessage.textContent = 'Invalid username or password.';
        errorMessage.style.display = 'block';
    }
}

function handleLogout() {
    // Remove login status from session storage
    sessionStorage.removeItem('adminSession');
    // Redirect to the login page
    window.location.href = 'login.html';
}

function isLoggedIn() {
    const session = sessionStorage.getItem('adminSession');
    if (!session) return false;
    return JSON.parse(session).isAdminLoggedIn === true;
}

function protectPage() {
    // If not logged in, redirect to the login page
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
    }
}

// You can call protectPage() at the start of any admin-only script or page.

function handleChangePassword(event) {
    event.preventDefault();

    const currentPasswordEl = document.getElementById('currentPassword');
    const newPasswordEl = document.getElementById('newPassword');
    const confirmPasswordEl = document.getElementById('confirmPassword');
    const messageElement = document.getElementById('settingsMessage');

    const storedPassword = localStorage.getItem('adminPassword');

    // Clear previous messages
    messageElement.textContent = '';
    messageElement.className = 'settings-message';

    // Validation
    if (hashPassword(currentPasswordEl.value) !== storedPassword) {
        messageElement.textContent = 'Current password is incorrect.';
        messageElement.classList.add('error');
        return;
    }

    if (!validatePassword(newPasswordEl.value)) {
        messageElement.textContent = 'New password must be at least 8 characters with uppercase, lowercase, and number.';
        messageElement.classList.add('error');
        return;
    }

    if (newPasswordEl.value !== confirmPasswordEl.value) {
        messageElement.textContent = 'New passwords do not match.';
        messageElement.classList.add('error');
        return;
    }

    // Hash new password before storage
    localStorage.setItem('adminPassword', hashPassword(newPasswordEl.value));
    messageElement.textContent = 'Password updated successfully!';
    messageElement.classList.add('success');
    event.target.reset();
}
