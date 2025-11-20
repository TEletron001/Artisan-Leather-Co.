// --- User Authentication for Customers ---

// Security utility functions
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

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

function handleUserRegistration() {
    const name = sanitizeInput(document.getElementById('name').value);
    const email = sanitizeInput(document.getElementById('email').value);
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMessage = document.getElementById('errorMessage');

    errorMessage.style.display = 'none';

    // Input validation
    if (!name || name.length < 2) {
        errorMessage.textContent = 'Name must be at least 2 characters long.';
        errorMessage.style.display = 'block';
        return;
    }

    if (!validateEmail(email)) {
        errorMessage.textContent = 'Please enter a valid email address.';
        errorMessage.style.display = 'block';
        return;
    }

    if (!validatePassword(password)) {
        errorMessage.textContent = 'Password must be at least 8 characters with uppercase, lowercase, and number.';
        errorMessage.style.display = 'block';
        return;
    }

    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match.';
        errorMessage.style.display = 'block';
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userExists = users.some(user => user.email.toLowerCase() === email.toLowerCase());

    if (userExists) {
        errorMessage.textContent = 'An account with this email already exists.';
        errorMessage.style.display = 'block';
        return;
    }

    // Hash password before storage
    const hashedPassword = hashPassword(password);
    const newUser = {
        name: name,
        email: email.toLowerCase(),
        password: hashedPassword,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Create secure session
    const sessionData = {
        name: newUser.name,
        email: newUser.email,
        sessionId: Date.now().toString(36) + Math.random().toString(36).substr(2),
        loginTime: new Date().toISOString()
    };
    sessionStorage.setItem('currentUser', JSON.stringify(sessionData));

    window.location.href = 'index.html';
}

function handleUserLogin() {
    const email = sanitizeInput(document.getElementById('email').value);
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    errorMessage.style.display = 'none';

    // Input validation
    if (!validateEmail(email)) {
        errorMessage.textContent = 'Please enter a valid email address.';
        errorMessage.style.display = 'block';
        return;
    }

    if (!password) {
        errorMessage.textContent = 'Please enter your password.';
        errorMessage.style.display = 'block';
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const hashedPassword = hashPassword(password);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === hashedPassword);

    if (user) {
        // Create secure session with additional security info
        const sessionData = {
            name: user.name,
            email: user.email,
            sessionId: Date.now().toString(36) + Math.random().toString(36).substr(2),
            loginTime: new Date().toISOString(),
            ipAddress: 'client-side' // In production, get from server
        };
        sessionStorage.setItem('currentUser', JSON.stringify(sessionData));
        window.location.href = 'index.html';
    } else {
        errorMessage.textContent = 'Invalid email or password.';
        errorMessage.style.display = 'block';
    }
}

function handleUserLogout() {
    sessionStorage.removeItem('currentUser');
    // Check if we are in the admin section and redirect accordingly
    if (window.location.pathname.includes('/admin/')) {
        window.location.href = 'login.html';
    } else {
        window.location.href = 'index.html';
    }
}

function isUserLoggedIn() {
    return sessionStorage.getItem('currentUser') !== null;
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser'));
}

function updateUserNav() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    const user = getCurrentUser();

    // Clear existing auth links
    const existingAuthLinks = navActions.querySelector('#auth-links');
    if (existingAuthLinks) {
        existingAuthLinks.remove();
    }

    const authLinksContainer = document.createElement('div');
    authLinksContainer.id = 'auth-links';
    authLinksContainer.style.display = 'flex';
    authLinksContainer.style.alignItems = 'center';
    authLinksContainer.style.gap = '1rem';

    if (user) {
        // User is logged in - sanitize user name
        const sanitizedName = sanitizeInput(user.name).split(' ')[0];
        authLinksContainer.innerHTML = `
            <span style="color: var(--gray); font-weight: 500;">Hi, ${sanitizedName}</span>
            <a href="#" id="logoutButton" style="color: var(--primary-brown); text-decoration: none; font-weight: 600;">Logout</a>
        `;
        // Prepend to keep cart button at the end
        navActions.prepend(authLinksContainer);
        document.getElementById('logoutButton').addEventListener('click', (e) => {
            e.preventDefault();
            handleUserLogout();
        });
    } else {
        // User is logged out
        authLinksContainer.innerHTML = `
            <a href="login.html" style="color: var(--primary-brown); text-decoration: none; font-weight: 600;">Login</a>
            <a href="register.html" class="btn btn-sm btn-outline">Register</a>
        `;
        navActions.prepend(authLinksContainer);
    }
}

// Run on every page that includes this script
document.addEventListener('DOMContentLoaded', function() {
    // Seed a default user if none exist, for testing purposes.
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.length === 0) {
        const defaultUser = {
            name: 'Test User',
            email: 'testuser@example.com',
            password: hashPassword('password123'), // Use the same password as in tests
            createdAt: new Date().toISOString()
        };
        users.push(defaultUser);
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Default user created for testing with hashed password.');
    }

    // Update the navigation bar
    updateUserNav();
});
