import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all storage before each test
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('Authentication Security', () => {
    test('should not store passwords in plain text', async ({ page }) => {
      await page.goto('/register.html');

      // Fill registration form
      await page.fill('#name', 'Test User');
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'password123');
      await page.fill('#confirmPassword', 'password123');

      // Submit form
      await page.click('button[type="submit"]');

      // Check that password is not stored in plain text
      const users = await page.evaluate(() => localStorage.getItem('users'));
      const userData = JSON.parse(users);
      const user = userData.find(u => u.email === 'test@example.com');

      // Password should be hashed, not plain text
      expect(user.password).not.toBe('password123');
      expect(user.password).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash pattern
    });

    test('should prevent brute force login attempts', async ({ page }) => {
      await page.goto('/login.html');

      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        await page.fill('#email', 'wrong@example.com');
        await page.fill('#password', 'wrongpassword');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(100);
      }

      // Check if account is locked or rate limited
      const errorMessage = await page.locator('#errorMessage').textContent();
      expect(errorMessage).toContain('Too many failed attempts');
    });

    test('should validate password strength', async ({ page }) => {
      await page.goto('/register.html');

      // Try weak password
      await page.fill('#name', 'Test User');
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', '123');
      await page.fill('#confirmPassword', '123');
      await page.click('button[type="submit"]');

      const errorMessage = await page.locator('#errorMessage').textContent();
      expect(errorMessage).toContain('Password must be at least 8 characters');
    });

    test('should prevent session fixation', async ({ page }) => {
      // Login with one user
      await page.goto('/login.html');
      await page.fill('#email', 'testuser@example.com');
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');

      // Check session ID changes after login
      const sessionBefore = await page.evaluate(() => sessionStorage.getItem('sessionId'));

      // Logout and login again
      await page.click('#logoutButton');
      await page.fill('#email', 'testuser@example.com');
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');

      const sessionAfter = await page.evaluate(() => sessionStorage.getItem('sessionId'));
      expect(sessionBefore).not.toBe(sessionAfter);
    });
  });

  test.describe('Admin Panel Security', () => {
    test('should prevent unauthorized admin access', async ({ page }) => {
      // Try to access admin without login
      await page.goto('/admin/dashboard.html');

      // Should redirect to login
      await expect(page).toHaveURL(/.*login\.html/);
    });

    test('should validate admin credentials securely', async ({ page }) => {
      await page.goto('/admin/login.html');

      // Try SQL injection
      await page.fill('#username', "admin' OR '1'='1");
      await page.fill('#password', "admin' OR '1'='1");
      await page.click('button[type="submit"]');

      // Should not login
      await expect(page).toHaveURL(/.*login\.html/);
    });

    test('should not expose admin password in client storage', async ({ page }) => {
      await page.goto('/admin/login.html');
      await page.fill('#username', 'admin');
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');

      // Check localStorage doesn't contain plain text password
      const adminPassword = await page.evaluate(() => localStorage.getItem('adminPassword'));
      expect(adminPassword).not.toBe('password123');
      expect(adminPassword).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash pattern
    });
  });

  test.describe('Payment Security', () => {
    test('should not store card details in localStorage', async ({ page }) => {
      await page.goto('/checkout.html');

      // Add item to cart first
      await page.addInitScript(() => {
        localStorage.setItem('cart', JSON.stringify([{
          id: 1,
          name: 'Test Product',
          price: 50,
          quantity: 1,
          image: 'test.jpg'
        }]));
      });

      await page.reload();

      // Fill checkout form
      await page.fill('#firstName', 'John');
      await page.fill('#lastName', 'Doe');
      await page.fill('#email', 'john@example.com');
      await page.fill('#phone', '0777123456');
      await page.selectOption('#location', 'harare-cbd');

      // Select card payment
      await page.check('input[name="paymentMethod"][value="card"]');
      await page.fill('#cardNumber', '4111111111111111');
      await page.fill('#cardExpiry', '12/25');
      await page.fill('#cardCVC', '123');
      await page.fill('#cardName', 'John Doe');

      await page.click('button[type="submit"]');

      // Check that card details are not stored in localStorage
      const orders = await page.evaluate(() => localStorage.getItem('orders'));
      if (orders) {
        const orderData = JSON.parse(orders);
        const latestOrder = orderData[orderData.length - 1];
        expect(latestOrder.cardNumber).toBeUndefined();
        expect(latestOrder.cardDetails).toBeUndefined();
      }
    });

    test('should validate card number format', async ({ page }) => {
      await page.goto('/checkout.html');

      await page.check('input[name="paymentMethod"][value="card"]');
      await page.fill('#cardNumber', '1234567890123456'); // Invalid card number
      await page.fill('#cardExpiry', '12/25');
      await page.fill('#cardCVC', '123');
      await page.fill('#cardName', 'John Doe');

      await page.click('button[type="submit"]');

      const errorMessage = await page.locator('#paymentFeedback .error').textContent();
      expect(errorMessage).toContain('Invalid card number');
    });
  });

  test.describe('Data Protection', () => {
    test('should sanitize user input to prevent XSS', async ({ page }) => {
      await page.goto('/register.html');

      // Try XSS attack
      const xssPayload = '<script>alert("XSS")</script>';
      await page.fill('#name', xssPayload);
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'password123');
      await page.fill('#confirmPassword', 'password123');
      await page.click('button[type="submit"]');

      // Check that script is not executed and data is sanitized
      await page.goto('/index.html');
      const userName = await page.evaluate(() => {
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        return user ? user.name : null;
      });

      expect(userName).not.toContain('<script>');
      expect(userName).toBe('<script>alert("XSS")</script>');
    });

    test('should not expose sensitive data in URL parameters', async ({ page }) => {
      // Simulate order confirmation with sensitive data in URL
      await page.goto('/order_confirmation.html?id=TEST-123&card=4111111111111111');

      // Check that sensitive data is not logged or exposed
      const url = page.url();
      expect(url).not.toContain('card=');
      expect(url).not.toContain('4111111111111111');
    });
  });

  test.describe('Session Security', () => {
    test('should expire sessions after inactivity', async ({ page }) => {
      await page.goto('/login.html');
      await page.fill('#email', 'testuser@example.com');
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');

      // Wait for session timeout (simulate)
      await page.waitForTimeout(30 * 60 * 1000); // 30 minutes

      // Try to access protected page
      await page.goto('/checkout.html');

      // Should redirect to login
      await expect(page).toHaveURL(/.*login\.html/);
    });

    test('should prevent session hijacking', async ({ page, context }) => {
      // Login on first page
      await page.goto('/login.html');
      await page.fill('#email', 'testuser@example.com');
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');

      const sessionId = await page.evaluate(() => sessionStorage.getItem('sessionId'));

      // Open new page with stolen session
      const newPage = await context.newPage();
      await newPage.addInitScript((sid) => {
        sessionStorage.setItem('sessionId', sid);
        sessionStorage.setItem('currentUser', JSON.stringify({ name: 'Hacker', email: 'hacker@example.com' }));
      }, sessionId);

      await newPage.goto('/checkout.html');

      // Should detect session tampering and logout
      await expect(newPage).toHaveURL(/.*login\.html/);
    });
  });

  test.describe('API Security', () => {
    test('should validate API responses', async ({ page }) => {
      // Mock malicious API response
      await page.route('**/api/payment', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            maliciousScript: '<script>alert("Hacked!")</script>'
          })
        });
      });

      await page.goto('/checkout.html');

      // Trigger payment
      await page.check('input[name="paymentMethod"][value="ecocash"]');
      await page.fill('#ecocashNumber', '0777123456');
      await page.click('button[type="submit"]');

      // Should not execute malicious script
      const alerts = [];
      page.on('dialog', dialog => {
        alerts.push(dialog.message());
        dialog.dismiss();
      });

      await page.waitForTimeout(1000);
      expect(alerts).not.toContain('Hacked!');
    });

    test('should handle API failures gracefully', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/payment', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      await page.goto('/checkout.html');
      await page.check('input[name="paymentMethod"][value="ecocash"]');
      await page.fill('#ecocashNumber', '0777123456');
      await page.click('button[type="submit"]');

      // Should show user-friendly error message
      const errorMessage = await page.locator('#paymentFeedback .error').textContent();
      expect(errorMessage).toContain('Payment failed');
      expect(errorMessage).not.toContain('Internal Server Error');
    });
  });
});
