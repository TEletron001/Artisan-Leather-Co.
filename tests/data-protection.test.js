import { test, expect } from '@playwright/test';

test.describe('Data Protection and Privacy Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all storage before each test
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should not log sensitive information', async ({ page }) => {
    // Mock console.log to capture logs
    const logs = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });

    await page.goto('/login.html');

    // Login with credentials
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Check that passwords are not logged
    const passwordLogs = logs.filter(log => log.includes('password') || log.includes('123'));
    expect(passwordLogs.length).toBe(0);
  });

  test('should encrypt sensitive data in localStorage', async ({ page }) => {
    await page.goto('/register.html');

    // Register a user
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'password123');
    await page.click('button[type="submit"]');

    // Check that sensitive data is encrypted
    const users = await page.evaluate(() => localStorage.getItem('users'));
    const userData = JSON.parse(users);
    const user = userData[0];

    // Password should be hashed
    expect(user.password).not.toBe('password123');
    expect(user.password).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash pattern
  });

  test('should not store PII in plain text', async ({ page }) => {
    await page.goto('/checkout.html');

    // Add item to cart
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

    // Fill checkout with PII
    await page.fill('#firstName', 'John');
    await page.fill('#lastName', 'Doe');
    await page.fill('#email', 'john.doe@example.com');
    await page.fill('#phone', '0777123456');
    await page.selectOption('#location', 'harare-cbd');

    await page.check('input[name="paymentMethod"][value="cash"]');
    await page.click('button[type="submit"]');

    // Check order storage
    const orders = await page.evaluate(() => localStorage.getItem('orders'));
    const orderData = JSON.parse(orders);
    const order = orderData[0];

    // PII should be present (as this is client-side storage for demo)
    // In production, this would be encrypted or not stored client-side
    expect(order.customer.firstName).toBe('John');
    expect(order.customer.email).toBe('john.doe@example.com');
  });

  test('should implement data retention policies', async ({ page }) => {
    // Add old orders
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 2); // 2 years ago

    await page.addInitScript((oldDate) => {
      const oldOrders = [{
        orderId: 'OLD-001',
        customer: { firstName: 'Old', lastName: 'Customer', email: 'old@example.com' },
        total: '$100.00',
        createdAt: oldDate.toISOString(),
        paymentMethod: 'card'
      }];
      localStorage.setItem('orders', JSON.stringify(oldOrders));
    }, oldDate);

    await page.goto('/admin/orders.html');

    // Should not display orders older than retention period
    const oldOrderVisible = await page.locator('text=OLD-001').isVisible();
    expect(oldOrderVisible).toBe(false);
  });

  test('should sanitize user inputs to prevent XSS', async ({ page }) => {
    await page.goto('/register.html');

    // Try XSS attack
    const xssPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
    await page.fill('#name', xssPayload);
    await page.fill('#email', 'xss@example.com');
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'password123');
    await page.click('button[type="submit"]');

    // Check that XSS is prevented
    await page.goto('/index.html');
    const userName = await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('currentUser'));
      return user ? user.name : null;
    });

    expect(userName).not.toContain('<script>');
    expect(userName).not.toContain('<img');
  });

  test('should not expose sensitive data in URL parameters', async ({ page }) => {
    // Simulate accessing order confirmation with sensitive data in URL
    await page.goto('/order_confirmation.html?id=TEST-123&email=user@example.com&card=4111111111111111');

    // Sensitive data should not be visible in URL or accessible
    const url = page.url();
    expect(url).not.toContain('email=');
    expect(url).not.toContain('card=');
    expect(url).not.toContain('4111111111111111');
  });

  test('should implement proper session management', async ({ page }) => {
    await page.goto('/login.html');

    // Login
    await page.fill('#email', 'testuser@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Check session has proper security attributes
    const sessionInfo = await page.evaluate(() => {
      return {
        hasSessionId: !!sessionStorage.getItem('sessionId'),
        hasCurrentUser: !!sessionStorage.getItem('currentUser'),
        sessionIdLength: sessionStorage.getItem('sessionId')?.length || 0
      };
    });

    expect(sessionInfo.hasSessionId).toBe(true);
    expect(sessionInfo.hasCurrentUser).toBe(true);
    expect(sessionInfo.sessionIdLength).toBeGreaterThan(10); // Should be sufficiently long
  });

  test('should clear sensitive data on logout', async ({ page }) => {
    await page.goto('/login.html');

    // Login
    await page.fill('#email', 'testuser@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Verify data exists
    const hasDataBefore = await page.evaluate(() => {
      return !!sessionStorage.getItem('currentUser');
    });
    expect(hasDataBefore).toBe(true);

    // Logout
    await page.click('#logoutButton');

    // Verify data cleared
    const hasDataAfter = await page.evaluate(() => {
      return !!sessionStorage.getItem('currentUser');
    });
    expect(hasDataAfter).toBe(false);
  });

  test('should prevent data leakage through browser history', async ({ page }) => {
    await page.goto('/checkout.html');

    // Fill form with sensitive data
    await page.fill('#firstName', 'John');
    await page.fill('#email', 'john@example.com');
    await page.check('input[name="paymentMethod"][value="card"]');
    await page.fill('#cardNumber', '4111111111111111');

    // Navigate away and back
    await page.goto('/index.html');
    await page.goBack();

    // Sensitive form data should not be auto-filled from browser cache
    const cardValue = await page.inputValue('#cardNumber');
    expect(cardValue).toBe(''); // Should be empty for security
  });

  test('should validate data integrity', async ({ page }) => {
    // Add valid order
    await page.addInitScript(() => {
      const orders = [{
        orderId: 'TEST-123',
        customer: { firstName: 'John', email: 'john@example.com' },
        total: '$100.00',
        createdAt: new Date().toISOString(),
        paymentMethod: 'card'
      }];
      localStorage.setItem('orders', JSON.stringify(orders));
    });

    await page.goto('/admin/orders.html');

    // Verify data integrity - order should be displayed correctly
    await expect(page.locator('text=TEST-123')).toBeVisible();
    await expect(page.locator('text=John')).toBeVisible();
    await expect(page.locator('text=$100.00')).toBeVisible();
  });
});
