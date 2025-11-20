// Cart functionality for all pages
class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.updateCartDisplay();
        this.setupCartEventListeners();
    }

    addItem(product, quantity = 1) {
        const existingItem = this.items.find(item => item.id === product.id);
        const quantityToAdd = parseInt(quantity, 10) || 1;

        if (existingItem) {
            // If item already exists, ask user to update quantity instead of auto-adding.
            this.showQuantityPrompt(product);
        } else {
            // If it's a new item, add it to the cart
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantityToAdd
            });
            this.saveToLocalStorage();
            this.updateCartDisplay();
            this.showNotification(`${product.name} (x${quantityToAdd}) was added to your cart.`);
            this.openCartSidebar();
        }
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveToLocalStorage();
        this.updateCartDisplay();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = quantity;
            if (item.quantity <= 0) {
                this.removeItem(productId);
            } else {
                this.saveToLocalStorage();
                this.updateCartDisplay();
            }
        }
    }

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    clearCart() {
        this.items = [];
        this.saveToLocalStorage();
        this.updateCartDisplay();
    }

    saveToLocalStorage() {
        // Sanitize cart items before saving
        const sanitizedItems = this.items.map(item => ({
            ...item,
            name: (item.name || '').replace(/[<>]/g, '').trim(),
            image: (item.image || '').replace(/[<>]/g, '').trim(),
            price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity) || 1
        }));
        localStorage.setItem('cart', JSON.stringify(sanitizedItems));
    }

    updateCartDisplay() {
        const cartCount = document.querySelector('.cart-count');
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        const checkoutBtn = document.querySelector('.cart-footer .btn-primary');

        if (cartCount) {
            cartCount.textContent = this.getItemCount();
        }

        if (cartItems) {
            cartItems.innerHTML = this.items.length > 0
                ? this.items.map(item => this.createCartItemHTML(item)).join('')
                : '<p class="empty-cart" style="text-align: center; padding: 2rem; color: var(--gray);">Your cart is empty</p>';
        }

        if (cartTotal) {
            cartTotal.textContent = `$${this.getTotal().toFixed(2)}`;
        }

        // Disable checkout button if cart is empty
        if (checkoutBtn) {
            if (this.items.length === 0) {
                checkoutBtn.disabled = true;
                checkoutBtn.textContent = 'Cart is Empty';
                checkoutBtn.style.opacity = '0.5';
                checkoutBtn.style.cursor = 'not-allowed';
            } else {
                checkoutBtn.disabled = false;
                checkoutBtn.textContent = 'Proceed to Checkout';
                checkoutBtn.style.opacity = '';
                checkoutBtn.style.cursor = '';
            }
        }
    }

    createCartItemHTML(item) {
        // Sanitize item data for display
        const sanitizedName = (item.name || '').replace(/[<>]/g, '').trim();
        const sanitizedImage = (item.image || '').replace(/[<>]/g, '').trim();
        const sanitizedPrice = parseFloat(item.price) || 0;
        const sanitizedQuantity = parseInt(item.quantity) || 1;

        return `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-img-wrapper">
                    <img src="${sanitizedImage}" alt="${sanitizedName}" class="cart-item-image">
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-header">
                        <div class="cart-item-title">${sanitizedName}</div>
                        <button class="cart-item-remove" data-product-id="${item.id}" title="Remove item">&times;</button>
                    </div>
                    <div class="cart-item-footer">
                        <div class="cart-item-quantity">
                            <button class="quantity-btn" data-product-id="${item.id}" data-change="-1">-</button>
                            <span class="quantity-value">${sanitizedQuantity}</span>
                            <button class="quantity-btn" data-product-id="${item.id}" data-change="1">+</button>
                        </div>
                        <div class="cart-item-price">$${(sanitizedPrice * sanitizedQuantity).toFixed(2)}</div>
                    </div>
                </div>
            </div>
        `;
    }

    showNotification(message) {
        // Remove existing notification if any
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--accent-gold);
            color: var(--black);
            padding: 1rem 2rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            z-index: 1002;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    openCartSidebar() {
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            cartSidebar.classList.add('active');
        }
    }

    showQuantityPrompt(product) {
        // Remove any existing prompt first
        const existingPrompt = document.getElementById('quantityPromptModal');
        if (existingPrompt) {
            existingPrompt.remove();
        }

        const existingItem = this.items.find(item => item.id === product.id);
        if (!existingItem) return;

        const promptHTML = `
            <div id="quantityPromptModal" class="quick-view-modal" style="z-index: 1003;">
                <div class="quick-view-content" style="max-width: 400px; text-align: center;">
                    <button class="close-modal">&times;</button>
                    <h3 style="margin-bottom: 1rem;">Already in Cart</h3>
                    <p style="margin-bottom: 1.5rem;">"${product.name}" is already in your cart. Would you like to update the quantity?</p>
                    <div class="quantity-selector" style="margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: center; gap: 1rem;">
                        <label for="updateQuantity" style="font-weight: 600;">Quantity:</label>
                        <input type="number" id="updateQuantity" value="${existingItem.quantity}" min="1" style="width: 70px; padding: 8px; text-align: center; border: 1px solid var(--light-brown); border-radius: var(--border-radius);">
                    </div>
                    <div style="display: flex; gap: 1rem; justify-content: center;">
                        <button id="updateQuantityBtn" class="btn btn-primary">Update Quantity</button>
                        <button id="cancelUpdateBtn" class="btn btn-outline">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', promptHTML);
        const modal = document.getElementById('quantityPromptModal');

        const closeModal = () => modal.remove();

        modal.querySelector('.close-modal').addEventListener('click', closeModal);
        modal.querySelector('#cancelUpdateBtn').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        modal.querySelector('#updateQuantityBtn').addEventListener('click', () => {
            const newQuantity = parseInt(modal.querySelector('#updateQuantity').value, 10);
            if (newQuantity > 0) {
                const oldQuantity = existingItem.quantity;
                this.updateQuantity(product.id, newQuantity);
                this.showNotification(`Quantity for "${product.name}" updated to ${newQuantity}.`);
            } else {
                this.removeItem(product.id);
                this.showNotification(`"${product.name}" removed from cart.`);
            }
            this.openCartSidebar();
            closeModal();
        });

        // Open the cart sidebar so the user sees the context
        this.openCartSidebar();
    }

    setupCartEventListeners() {
        const cartItemsContainer = document.getElementById('cartItems');
        if (cartItemsContainer) {
            cartItemsContainer.addEventListener('click', (event) => {
                const removeButton = event.target.closest('.cart-item-remove');
                if (removeButton) {
                    event.preventDefault();
                    window.preventCartClose = true; // Prevent sidebar from closing on outside click
                    const productId = parseInt(removeButton.dataset.productId, 10);
                    this.removeItem(productId);
                    return; // Stop further processing
                }

                const quantityButton = event.target.closest('.quantity-btn');
                if (quantityButton) {
                    event.preventDefault();
                    window.preventCartClose = true; // Prevent sidebar from closing on outside click
                    const productId = parseInt(quantityButton.dataset.productId, 10);
                    const change = parseInt(quantityButton.dataset.change, 10);
                    const item = this.items.find(i => i.id === productId);
                    if (item) {
                        this.updateQuantity(productId, item.quantity + change);
                    }
                }
            });
        }
    }
}

// Initialize cart globally
window.cart = new Cart();