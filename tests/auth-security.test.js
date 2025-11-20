import { test, expect } from '@playwright/test';

test.describe('Authentication Security Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all storage before each test
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should prevent unauthorized access to admin panel', async ({ page }) => {
    // Try to access admin dashboard without login
    await page.goto('/admin/dashboard.html');

    // Should redirect to login page
    await expect(page.url()).toContain('login.html');
  });

  test('should prevent SQL injection in login forms', async ({ page }) => {
    await page.goto('/login.html');

    // Attempt SQL injection
    await page.fill('#email', "' OR '1'='1' --");
    await page.fill('#password', "' OR '1'='1' --");
    await page.click('button[type="submit"]');

    // Should not login and show error
    const errorMessage = await page.locator('#errorMessage').isVisible();
    expect(errorMessage).toBe(true);
  });

  test('should prevent XSS in user input', async ({ page }) => {
    await page.goto('/register.html');

    // Attempt XSS attack
    const xssPayload = '<script>alert("XSS")</script>';
    await page.fill('#name', xssPayload);
    await page.fill('#email', 'xss@example.com');
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'password123');
    await page.click('button[type="submit"]');

    // Check that XSS is not executed
    await page.goto('/index.html');
    const userName = await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('currentUser'));
      return user ? user.name : null;
    });

    expect(userName).not.toContain('<script>');
  });

  test('should enforce password complexity requirements', async ({ page }) => {
    await page.goto('/register.html');

    // Try weak password
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', '123');
    await page.fill('#confirmPassword', '123');
    await page.click('button[type="submit"]');

    // Should show password strength error
    const errorMessage = await page.locator('#errorMessage').textContent();
    expect(errorMessage).toContain('at least 8 characters');
  });

  test('should prevent brute force attacks', async ({ page }) => {
    await page.goto('/login.html');

    // Attempt multiple failed logins
    for (let i = 0; i < 5; i++) {
      await page.fill('#email', 'wrong@example.com');
      await page.fill('#password', 'wrongpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(100); // Small delay to simulate attempts
    }

    // Should show rate limiting message
    const errorMessage = await page.locator('#errorMessage').textContent();
    expect(errorMessage).toContain('Too many failed attempts');
  });

  test('should securely store user sessions', async ({ page }) => {
    await page.goto('/login.html');

    // Login with valid credentials
    await page.fill('#email', 'testuser@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Check that sensitive data is not in sessionStorage
    const sessionData = await page.evaluate(() => {
      return {
        currentUser: sessionStorage.getItem('currentUser'),
        password: sessionStorage.getItem('password')
      };
    });

    expect(sessionData.currentUser).toBeTruthy();
    expect(sessionData.password).toBeNull(); // Password should not be stored in session
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/register.html');

    // Try invalid email
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'invalid-email');
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'password123');
    await page.click('button[type="submit"]');

    // Should show email validation error
    const errorMessage = await page.locator('#errorMessage').textContent();
    expect(errorMessage).toContain('valid email');
  });

  test('should prevent account enumeration', async ({ page }) => {
    await page.goto('/login.html');

    // Try login with non-existent email
    await page.fill('#email', 'nonexistent@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Error message should be generic, not reveal if email exists
    const errorMessage = await page.locator('#errorMessage').textContent();
    expect(errorMessage).toContain('Invalid credentials');
    expect(errorMessage).not.toContain('email not found');
  });

  test('should expire sessions on logout', async ({ page }) => {
    await page.goto('/login.html');

    // Login
    await page.fill('#email', 'testuser@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Verify logged in
    const userLoggedIn = await page.evaluate(() => !!sessionStorage.getItem('currentUser'));
    expect(userLoggedIn).toBe(true);

    // Logout
    await page.click('#logoutButton');

    // Verify session cleared
    const userAfterLogout = await page.evaluate(() => !!sessionStorage.getItem('currentUser'));
    expect(userAfterLogout).toBe(false);
  });

  test('should prevent session fixation', async ({ page }) => {
    // Set a fixed session ID before login
    await page.addInitScript(() => {
      sessionStorage.setItem('sessionId', 'fixed-session-id');
    });

    await page.goto('/login.html');

    // Login
    await page.fill('#email', 'testuser@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Session ID should change after login
    const sessionIdAfterLogin = await page.evaluate(() => sessionStorage.getItem('sessionId'));
    expect(sessionIdAfterLogin).not.toBe('fixed-session-id');
  });
});
