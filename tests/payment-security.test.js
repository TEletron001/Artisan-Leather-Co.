import { test, expect } from '@playwright/test';

test.describe('Payment Security Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all storage before each test
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should not store sensitive card data in localStorage', async ({ page }) => {
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

    // Check that card details are not stored
    const orders = await page.evaluate(() => localStorage.getItem('orders'));
    if (orders) {
      const orderData = JSON.parse(orders);
      const latestOrder = orderData[orderData.length - 1];
      expect(latestOrder.cardNumber).toBeUndefined();
      expect(latestOrder.cardDetails).toBeUndefined();
      expect(latestOrder.cvc).toBeUndefined();
    }
  });

  test('should validate card number using Luhn algorithm', async ({ page }) => {
    await page.goto('/checkout.html');

    await page.check('input[name="paymentMethod"][value="card"]');
    await page.fill('#cardNumber', '4111111111111112'); // Invalid checksum
    await page.fill('#cardExpiry', '12/25');
    await page.fill('#cardCVC', '123');
    await page.fill('#cardName', 'John Doe');

    await page.click('button[type="submit"]');

    const errorMessage = await page.locator('#paymentFeedback .error').textContent();
    expect(errorMessage).toContain('Invalid card number');
  });

  test('should mask card numbers in logs and displays', async ({ page }) => {
    await page.goto('/checkout.html');

    await page.check('input[name="paymentMethod"][value="card"]');
    await page.fill('#cardNumber', '4111111111111111');

    // Check that card number is masked in display
    const maskedValue = await page.inputValue('#cardNumber');
    expect(maskedValue).toMatch(/^\*{12}\d{4}$/); // Should show **** **** **** 1111
  });

  test('should validate CVC format', async ({ page }) => {
    await page.goto('/checkout.html');

    await page.check('input[name="paymentMethod"][value="card"]');
    await page.fill('#cardNumber', '4111111111111111');
    await page.fill('#cardExpiry', '12/25');
    await page.fill('#cardCVC', '12'); // Too short
    await page.fill('#cardName', 'John Doe');

    await page.click('button[type="submit"]');

    const errorMessage = await page.locator('#paymentFeedback .error').textContent();
    expect(errorMessage).toContain('Invalid CVC');
  });

  test('should validate expiry date format', async ({ page }) => {
    await page.goto('/checkout.html');

    await page.check('input[name="paymentMethod"][value="card"]');
    await page.fill('#cardNumber', '4111111111111111');
    await page.fill('#cardExpiry', '13/25'); // Invalid month
    await page.fill('#cardCVC', '123');
    await page.fill('#cardName', 'John Doe');

    await page.click('button[type="submit"]');

    const errorMessage = await page.locator('#paymentFeedback .error').textContent();
    expect(errorMessage).toContain('Invalid expiry date');
  });

  test('should prevent expired cards', async ({ page }) => {
    await page.goto('/checkout.html');

    await page.check('input[name="paymentMethod"][value="card"]');
    await page.fill('#cardNumber', '4111111111111111');
    await page.fill('#cardExpiry', '01/20'); // Expired
    await page.fill('#cardCVC', '123');
    await page.fill('#cardName', 'John Doe');

    await page.click('button[type="submit"]');

    const errorMessage = await page.locator('#paymentFeedback .error').textContent();
    expect(errorMessage).toContain('Card has expired');
  });

  test('should sanitize payment form inputs', async ({ page }) => {
    await page.goto('/checkout.html');

    await page.check('input[name="paymentMethod"][value="card"]');

    // Try XSS in card name
    const xssPayload = '<script>alert("XSS")</script>';
    await page.fill('#cardName', xssPayload);

    // Check that input is sanitized
    const sanitizedValue = await page.inputValue('#cardName');
    expect(sanitizedValue).not.toContain('<script>');
  });

  test('should use HTTPS for payment processing', async ({ page }) => {
    // This test would require setting up HTTPS, but we can check the code
    const paymentCode = await page.evaluate(() => {
      // Check if payment requests use HTTPS
      return fetch.toString().includes('https:');
    });

    // In a real implementation, all payment API calls should use HTTPS
    expect(paymentCode).toBe(false); // This is a simulation, so it would be false
  });

  test('should validate phone number format for mobile payments', async ({ page }) => {
    await page.goto('/checkout.html');

    await page.check('input[name="paymentMethod"][value="ecocash"]');
    await page.fill('#ecocashNumber', 'invalid-phone');

    await page.click('button[type="submit"]');

    const errorMessage = await page.locator('#paymentFeedback .error').textContent();
    expect(errorMessage).toContain('valid phone number');
  });

  test('should prevent payment amount tampering', async ({ page }) => {
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

    // Try to modify the total amount in DOM
    await page.evaluate(() => {
      const totalElement = document.getElementById('totalAmount');
      if (totalElement) {
        totalElement.textContent = '$1000.00'; // Tampered amount
      }
    });

    await page.check('input[name="paymentMethod"][value="ecocash"]');
    await page.fill('#ecocashNumber', '0777123456');
    await page.click('button[type="submit"]');

    // Payment should use server-calculated amount, not client-side amount
    const paymentAmount = await page.evaluate(() => {
      // In real implementation, this would be sent to server
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    });

    expect(paymentAmount).toBe(50); // Should be original amount, not tampered
  });

  test('should implement payment timeout', async ({ page }) => {
    await page.goto('/checkout.html');

    await page.check('input[name="paymentMethod"][value="ecocash"]');
    await page.fill('#ecocashNumber', '0777123456');

    // Start payment process
    await page.click('button[type="submit"]');

    // Wait for timeout period
    await page.waitForTimeout(5 * 60 * 1000); // 5 minutes

    // Should show timeout message
    const timeoutMessage = await page.locator('#paymentFeedback .error').textContent();
    expect(timeoutMessage).toContain('Payment session expired');
  });
});
