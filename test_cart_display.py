#!/usr/bin/env python3
"""
Simple test script to verify cart display functionality.
This script simulates adding items to cart and checks if the sidebar opens.
"""

import json
import os
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException

def setup_driver():
    """Setup Chrome driver with headless mode."""
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")

    try:
        driver = webdriver.Chrome(options=chrome_options)
        return driver
    except WebDriverException as e:
        print(f"Failed to setup Chrome driver: {e}")
        print("Please ensure Chrome and ChromeDriver are installed.")
        return None

def test_cart_display():
    """Test cart display functionality."""
    driver = setup_driver()
    if not driver:
        return False

    base_url = "http://localhost:8000"
    results = []

    try:
        # Test 1: Products page add to cart
        print("Testing products page add to cart...")
        driver.get(f"{base_url}/products.html")

        # Wait for products to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "product-card"))
        )

        # Click add to cart button
        add_to_cart_buttons = driver.find_elements(By.CLASS_NAME, "add-to-cart-btn")
        if add_to_cart_buttons:
            add_to_cart_buttons[0].click()

            # Check if cart sidebar is visible
            try:
                cart_sidebar = WebDriverWait(driver, 5).until(
                    EC.visibility_of_element_located((By.CLASS_NAME, "cart-sidebar"))
                )
                if "active" in cart_sidebar.get_attribute("class"):
                    results.append(("Products page add to cart", True))
                    print("✓ Cart sidebar opened on products page")
                else:
                    results.append(("Products page add to cart", False))
                    print("✗ Cart sidebar not opened on products page")
            except TimeoutException:
                results.append(("Products page add to cart", False))
                print("✗ Cart sidebar not found on products page")

            # Check notification
            try:
                notification = WebDriverWait(driver, 5).until(
                    EC.visibility_of_element_located((By.CLASS_NAME, "notification"))
                )
                results.append(("Notification display", True))
                print("✓ Notification displayed")
            except TimeoutException:
                results.append(("Notification display", False))
                print("✗ Notification not displayed")
        else:
            results.append(("Products page add to cart", False))
            print("✗ No add to cart buttons found")

        # Test 2: Index page add to cart
        print("\nTesting index page add to cart...")
        driver.get(f"{base_url}/index.html")

        # Wait for featured products to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "product-card"))
        )

        # Click add to cart button
        add_to_cart_buttons = driver.find_elements(By.CLASS_NAME, "add-to-cart-btn")
        if add_to_cart_buttons:
            add_to_cart_buttons[0].click()

            # Check if cart sidebar is visible
            try:
                cart_sidebar = WebDriverWait(driver, 5).until(
                    EC.visibility_of_element_located((By.CLASS_NAME, "cart-sidebar"))
                )
                if "active" in cart_sidebar.get_attribute("class"):
                    results.append(("Index page add to cart", True))
                    print("✓ Cart sidebar opened on index page")
                else:
                    results.append(("Index page add to cart", False))
                    print("✗ Cart sidebar not opened on index page")
            except TimeoutException:
                results.append(("Index page add to cart", False))
                print("✗ Cart sidebar not found on index page")
        else:
            results.append(("Index page add to cart", False))
            print("✗ No add to cart buttons found on index page")

        # Test 3: Cart count update
        print("\nTesting cart count update...")
        cart_count = driver.find_element(By.CLASS_NAME, "cart-count")
        initial_count = cart_count.text
        print(f"Initial cart count: {initial_count}")

        # Add another item
        add_to_cart_buttons = driver.find_elements(By.CLASS_NAME, "add-to-cart-btn")
        if add_to_cart_buttons and len(add_to_cart_buttons) > 1:
            add_to_cart_buttons[1].click()
            time.sleep(1)  # Wait for update
            updated_count = cart_count.text
            print(f"Updated cart count: {updated_count}")
            if updated_count != initial_count:
                results.append(("Cart count update", True))
                print("✓ Cart count updated correctly")
            else:
                results.append(("Cart count update", False))
                print("✗ Cart count not updated")
        else:
            results.append(("Cart count update", False))
            print("✗ Not enough add to cart buttons for count test")

    except Exception as e:
        print(f"Test failed with error: {e}")
        results.append(("Test execution", False))

    finally:
        driver.quit()

    # Print results summary
    print("\n" + "="*50)
    print("TEST RESULTS SUMMARY")
    print("="*50)

    passed = 0
    total = len(results)

    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1

    print(f"\nPassed: {passed}/{total}")

    if passed == total:
        print("🎉 All tests passed!")
        return True
    else:
        print("❌ Some tests failed.")
        return False

if __name__ == "__main__":
    print("Cart Display Test Suite")
    print("=======================")

    # Check if server is running
    import requests
    try:
        response = requests.get("http://localhost:8000", timeout=5)
        if response.status_code == 200:
            print("✓ Local server is running")
        else:
            print("✗ Local server not responding correctly")
            sys.exit(1)
    except requests.exceptions.RequestException:
        print("✗ Local server not running. Please start with: python -m http.server 8000")
        sys.exit(1)

    success = test_cart_display()
    sys.exit(0 if success else 1)
