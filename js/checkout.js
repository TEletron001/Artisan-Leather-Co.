// Checkout page functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeCheckout();
    loadCartSummary();
    setupDeliveryCalculation();
    setupPaymentMethods();
});

function initializeCheckout() {
    // Check if user is logged in (optional for checkout)
    const user = getCurrentUser();
    if (user) {
        // Pre-fill user information if available (with sanitization)
        const emailField = document.getElementById('email');
        if (emailField && user.email) {
            emailField.value = user.email.replace(/[<>]/g, '').trim();
        }
    }

    // Load cart items
    loadCartSummary();
}

function loadCartSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const summaryItems = document.getElementById('summaryItems');
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('totalAmount');

    if (!summaryItems || !subtotalEl || !totalEl) return;

    if (cart.length === 0) {
        summaryItems.innerHTML = '<p style="text-align: center; padding: 2rem;">Your cart is empty</p>';
        subtotalEl.textContent = '$0.00';
        totalEl.textContent = '$0.00';
        return;
    }

    // Calculate subtotal
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Render cart items with sanitization
    summaryItems.innerHTML = cart.map(item => {
        const sanitizedName = (item.name || '').replace(/[<>]/g, '').trim();
        const sanitizedImage = (item.image || '').replace(/[<>]/g, '').trim();
        const sanitizedPrice = parseFloat(item.price) || 0;
        const sanitizedQuantity = parseInt(item.quantity) || 0;

        return `
        <div class="summary-item">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <img src="${sanitizedImage}" alt="${sanitizedName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                <div>
                    <div style="font-weight: 600;">${sanitizedName}</div>
                    <div style="font-size: 0.9rem; color: var(--gray);">Qty: ${sanitizedQuantity}</div>
                </div>
            </div>
            <div style="font-weight: 600;">$${(sanitizedPrice * sanitizedQuantity).toFixed(2)}</div>
        </div>
    `}).join('');

    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    totalEl.textContent = `$${subtotal.toFixed(2)}`; // Will be updated with delivery fee

    // Calculate initial delivery fee
    calculateDelivery();
}

function setupDeliveryCalculation() {
    const locationSelect = document.getElementById('location');
    if (locationSelect) {
        locationSelect.addEventListener('change', calculateDelivery);
    }
}

function calculateDelivery() {
    const locationSelect = document.getElementById('location');
    const deliveryFeeEl = document.getElementById('deliveryFee');
    const totalEl = document.getElementById('totalAmount');

    if (!locationSelect || !deliveryFeeEl || !totalEl) return;

    const location = locationSelect.value;
    let deliveryFee = 0;

    switch(location) {
        case 'harare-cbd':
            deliveryFee = 0;
            break;
        case 'near-harare':
            deliveryFee = 5;
            break;
        case 'outside-harare':
            deliveryFee = 15;
            break;
        case 'rural-areas':
            deliveryFee = 30;
            break;
        default:
            deliveryFee = 0;
    }

    deliveryFeeEl.textContent = `$${deliveryFee.toFixed(2)}`;

    // Update total
    const subtotal = parseFloat(document.getElementById('subtotal').textContent.replace('$', ''));
    const total = subtotal + deliveryFee;
    totalEl.textContent = `$${total.toFixed(2)}`;
}

function setupPaymentMethods() {
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            updatePaymentDetails(this.value);
        });
    });
}

function updatePaymentDetails(paymentMethod) {
    // Hide all payment details
    const allDetails = document.querySelectorAll('.payment-details');
    allDetails.forEach(detail => {
        detail.style.display = 'none';
        // Clear required attributes
        const inputs = detail.querySelectorAll('input[required]');
        inputs.forEach(input => input.removeAttribute('required'));
    });

    // Show relevant details
    if (paymentMethod === 'ecocash') {
        const ecocashDetails = document.getElementById('ecocashDetails');
        if (ecocashDetails) {
            ecocashDetails.style.display = 'block';
            const inputs = ecocashDetails.querySelectorAll('input');
            inputs.forEach(input => input.setAttribute('required', 'true'));
        }
    } else if (paymentMethod === 'innbucks') {
        const innbucksDetails = document.getElementById('innbucksDetails');
        if (innbucksDetails) {
            innbucksDetails.style.display = 'block';
            const inputs = innbucksDetails.querySelectorAll('input');
            inputs.forEach(input => input.setAttribute('required', 'true'));
        }
    }
}

// Helper function to get current user (from auth-user.js)
function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser'));
}

// Export functions for use in payment.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadCartSummary,
        calculateDelivery,
        updatePaymentDetails
    };
}
