import { test, expect } from '@playwright/test';

test.describe('Cart Display Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cart before each test
    await page.addInitScript(() => {
      localStorage.removeItem('cart');
    });
  });

  test('cart sidebar opens automatically when adding item from products page', async ({ page }) => {
    await page.goto('/products.html');

    // Wait for products to load
    await page.waitForSelector('.product-card');

    // Click add to cart button
    const addToCartButton = page.locator('.add-to-cart-btn').first();
    await addToCartButton.click();

    // Check if cart sidebar is open
    await expect(page.locator('.cart-sidebar.active')).toBeVisible();

    // Check if notification appears
    await expect(page.locator('.notification')).toBeVisible();
  });

  test('cart sidebar opens automatically when adding item from index page', async ({ page }) => {
    await page.goto('/index.html');

    // Wait for featured products to load
    await page.waitForSelector('.product-card');

    // Click add to cart button
    const addToCartButton = page.locator('.add-to-cart-btn').first();
    await addToCartButton.click();

    // Check if cart sidebar is open
    await expect(page.locator('.cart-sidebar.active')).toBeVisible();

    // Check if notification appears
    await expect(page.locator('.notification')).toBeVisible();
  });

  test('cart sidebar opens automatically when adding item from quick view modal', async ({ page }) => {
    await page.goto('/products.html');

    // Wait for products to load
    await page.waitForSelector('.product-card');

    // Click view details button to open quick view
    const viewDetailsButton = page.locator('.view-details-btn').first();
    await viewDetailsButton.click();

    // Wait for modal to appear
    await page.waitForSelector('.quick-view-modal');

    // Click add to cart in modal
    const modalAddToCartButton = page.locator('.modal-add-to-cart');
    await modalAddToCartButton.click();

    // Check if cart sidebar is open
    await expect(page.locator('.cart-sidebar.active')).toBeVisible();

    // Check if notification appears
    await expect(page.locator('.notification')).toBeVisible();
  });

  test('cart count updates correctly', async ({ page }) => {
    await page.goto('/products.html');

    // Wait for products to load
    await page.waitForSelector('.product-card');

    // Check initial cart count
    await expect(page.locator('.cart-count')).toHaveText('0');

    // Add first item
    const addToCartButton = page.locator('.add-to-cart-btn').first();
    await addToCartButton.click();

    // Check cart count updated
    await expect(page.locator('.cart-count')).toHaveText('1');

    // Add another item
    await addToCartButton.click();

    // Check cart count updated again
    await expect(page.locator('.cart-count')).toHaveText('2');
  });

  test('cart items display correctly in sidebar', async ({ page }) => {
    await page.goto('/products.html');

    // Wait for products to load
    await page.waitForSelector('.product-card');

    // Add item to cart
    const addToCartButton = page.locator('.add-to-cart-btn').first();
    await addToCartButton.click();

    // Check cart sidebar content
    await expect(page.locator('.cart-sidebar.active')).toBeVisible();
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await expect(page.locator('.cart-item-title')).toBeVisible();
    await expect(page.locator('.cart-item-price')).toBeVisible();
  });
});
