import { test, expect } from '@playwright/test';

test.describe('Order Confirmation Page Tests', () => {
  const mockOrder = {
    orderId: 'TEST-123',
    customer: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '0777123456'
    },
    items: [
      {
        id: 1,
        name: 'Classic Leather Wallet',
        price: 45.00,
        quantity: 2,
        image: 'images/products/wallet-1.jpg'
      }
    ],
    total: '$90.00',
    createdAt: new Date().toISOString(),
    paymentMethod: 'ecocash'
  };

  test.beforeEach(async ({ page }) => {
    // Setup mock data
    await page.addInitScript(order => {
      localStorage.setItem('orders', JSON.stringify([order]));
    }, mockOrder);
  });

  test('displays order confirmation details correctly', async ({ page }) => {
    await page.goto('/order_confirmation.html?id=TEST-123');
    
    // Check page title
    await expect(page).toHaveTitle(/Order Confirmation/);
    
    // Verify customer information
    await expect(page.locator('#confirmationHeading')).toHaveText('Thank You, John!');
    await expect(page.locator('#customerDetails')).toContainText('John Doe');
    await expect(page.locator('#customerDetails')).toContainText('john@example.com');
    await expect(page.locator('#customerDetails')).toContainText('0777123456');
    
    // Check order items
    await expect(page.locator('#orderItems')).toContainText('Classic Leather Wallet');
    await expect(page.locator('#orderItems')).toContainText('Qty: 2');
    await expect(page.locator('#orderItems')).toContainText('$45.00');
    
    // Verify totals
    await expect(page.locator('.order-summary-totals')).toContainText('Total: $90.00');
  });

  test('handles missing order gracefully', async ({ page }) => {
    await page.goto('/order_confirmation.html?id=INVALID-ID');
    
    await expect(page.locator('.confirmation-card')).toContainText('Order Not Found');
    await expect(page.locator('a[href="index.html"]')).toBeVisible();
  });

  test('clears cart after successful order confirmation', async ({ page }) => {
    // Setup mock cart
    await page.addInitScript(() => {
      localStorage.setItem('cart', JSON.stringify([
        { id: 1, name: 'Test Item', price: 10, quantity: 1 }
      ]));
    });

    await page.goto('/order_confirmation.html?id=TEST-123');
    
    // Verify cart is cleared
    const cartAfter = await page.evaluate(() => localStorage.getItem('cart'));
    expect(cartAfter).toBeNull();
  });

  test('print functionality works', async ({ page }) => {
    await page.goto('/order_confirmation.html?id=TEST-123');
    
    // Mock print function
    await page.evaluate(() => {
      window.print = () => {};
    });
    
    const printButton = page.locator('button.btn.btn-primary');
    await expect(printButton).toBeVisible();
    await printButton.click();
  });
});