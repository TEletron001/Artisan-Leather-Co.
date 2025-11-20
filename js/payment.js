// Complete Payment Gateway Integration for E-commerce
class PaymentProcessor {
    constructor() {
        this.ecocashConfig = { 
            merchantCode: '1',
            recipientPhone: '0788025819'
        };
        this.innbucksConfig = { 
            merchantCode: '1',
            recipientPhone: '0788025819'
        };
        this.merchantCard = '00000233409367';
    }

    // EcoCash payment processing
    async processEcoCashPayment(amount, phoneNumber, orderId) {
        const ussdCode = this.generateEcoCashUSSD(amount);
        console.log('EcoCash USSD:', ussdCode);
        
        const paymentData = { 
            provider: 'ecocash', 
            amount, 
            customerPhone: phoneNumber,
            recipientPhone: this.ecocashConfig.recipientPhone,
            orderId,
            ussdCode 
        };
        return this.simulateEcoCashAPI(paymentData);
    }

    // InnBucks payment processing
    async processInnBucksPayment(amount, phoneNumber, orderId) {
        const ussdCode = this.generateInnBucksUSSD(amount);
        console.log('InnBucks USSD:', ussdCode);
        
        const paymentData = { 
            provider: 'innbucks', 
            amount, 
            customerPhone: phoneNumber,
            recipientPhone: this.innbucksConfig.recipientPhone,
            orderId,
            ussdCode 
        };
        return this.simulateInnBucksAPI(paymentData);
    }

    // Visa payment processing
    async processVisaPayment(amount, cardNumber, expiry, cvc, name, orderId) {
        const paymentData = { 
            provider: 'visa', 
            amount, 
            customerCard: cardNumber,
            merchantCard: this.merchantCard,
            expiry, 
            cvc, 
            name, 
            orderId 
        };
        return this.simulateCardAPI(paymentData);
    }

    // Mastercard payment processing
    async processMastercardPayment(amount, cardNumber, expiry, cvc, name, orderId) {
        const paymentData = { 
            provider: 'mastercard', 
            amount, 
            customerCard: cardNumber,
            merchantCard: this.merchantCard,
            expiry, 
            cvc, 
            name, 
            orderId 
        };
        return this.simulateCardAPI(paymentData);
    }

    // Generate EcoCash USSD code: *153*1*1*0788025819*AMOUNT#
    generateEcoCashUSSD(amount) {
        const formattedAmount = Math.round(amount);
        return `*153*${this.ecocashConfig.merchantCode}*1*${this.ecocashConfig.recipientPhone}*${formattedAmount}#`;
    }

    // Generate InnBucks USSD code: *569*1*1*2*1*0788025819*AMOUNT#
    generateInnBucksUSSD(amount) {
        const formattedAmount = Math.round(amount);
        return `*569*${this.innbucksConfig.merchantCode}*1*2*1*${this.innbucksConfig.recipientPhone}*${formattedAmount}#`;
    }

    // Simulate EcoCash API
    simulateEcoCashAPI(paymentData) {
        return new Promise(resolve => {
            setTimeout(() => {
                const success = Math.random() > 0.1;
                resolve({ 
                    success, 
                    message: success ? 'EcoCash payment successful' : 'EcoCash payment failed',
                    ussdCode: paymentData.ussdCode,
                    transactionId: 'ECOCASH-' + Date.now(),
                    amount: paymentData.amount
                });
            }, 1500);
        });
    }

    // Simulate InnBucks API
    simulateInnBucksAPI(paymentData) {
        return new Promise(resolve => {
            setTimeout(() => {
                const success = Math.random() > 0.1;
                resolve({ 
                    success, 
                    message: success ? 'InnBucks payment successful' : 'InnBucks payment failed',
                    ussdCode: paymentData.ussdCode,
                    transactionId: 'INNBUCKS-' + Date.now(),
                    amount: paymentData.amount
                });
            }, 1500);
        });
    }

    // Simulate Card API
    simulateCardAPI(paymentData) {
        return new Promise(resolve => {
            setTimeout(() => {
                const success = Math.random() > 0.05;
                resolve({ 
                    success, 
                    message: success ? `${paymentData.provider} payment successful` : `${paymentData.provider} payment declined`,
                    transactionId: paymentData.provider.toUpperCase() + '-' + Date.now(),
                    amount: paymentData.amount
                });
            }, 1200);
        });
    }

    // Process cash on delivery
    async processCashOnDelivery(orderId, amount) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ 
                    success: true, 
                    message: 'Cash on delivery order confirmed',
                    orderId,
                    amount
                });
            }, 500);
        });
    }

    // Phone validation for Zimbabwe numbers
    validatePhoneNumber(phone) {
        if (!phone) return false;
        const sanitized = phone.replace(/[^0-9+]/g, '').trim();
        const phoneRegex = /^(\+263|0)(77|78|71|73|76)[0-9]{7}$/;
        return phoneRegex.test(sanitized);
    }

    // Card validation
    validateCardNumber(cardNumber) {
        if (!cardNumber) return false;
        const cleanNumber = cardNumber.replace(/\s+/g, '');
        return cleanNumber.length >= 13 && cleanNumber.length <= 19 && this.luhnCheck(cleanNumber);
    }

    validateCVC(cvc) {
        return /^[0-9]{3,4}$/.test(cvc);
    }

    validateExpiry(expiry) {
        if (!expiry) return false;
        const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
        if (!expiryRegex.test(expiry)) return false;
        
        const [month, year] = expiry.split('/');
        const expiryDate = new Date(2000 + parseInt(year), parseInt(month));
        return expiryDate > new Date();
    }

    // Luhn algorithm for card validation
    luhnCheck(cardNumber) {
        let sum = 0;
        let isEven = false;
        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber.charAt(i), 10);
            if (isEven) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            isEven = !isEven;
        }
        return (sum % 10) === 0;
    }

    // Card number masking
    maskCardNumber(input) {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/g, '');
            e.target.dataset.realValue = value;
            
            let formatted = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) formatted += ' ';
                if (i < value.length - 4) formatted += '•';
                else formatted += value[i];
            }
            e.target.value = formatted;
        });
    }

    // Sanitize card details
    sanitizeCardDetails(cardNumber, expiry, cvc, name) {
        return {
            cardNumber: (cardNumber || '').replace(/[^0-9]/g, '').trim(),
            expiry: (expiry || '').replace(/[^0-9\/]/g, '').trim(),
            cvc: (cvc || '').replace(/[^0-9]/g, '').trim(),
            name: (name || '').replace(/[<>]/g, '').trim().substring(0, 50)
        };
    }
}

// Initialize payment processor
const paymentProcessor = new PaymentProcessor();

// DOM Ready - Initialize all payment functionality
document.addEventListener('DOMContentLoaded', function() {
    initializePaymentSystem();
});

function initializePaymentSystem() {
    const checkoutForm = document.getElementById('checkoutForm');
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');

    // Payment method selection
    paymentMethods.forEach(pm => {
        pm.addEventListener('change', (e) => {
            togglePaymentDetails(e.target.value);
            updatePaymentInstructions(e.target.value);
        });
    });

    // Form submission
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processCheckoutPayment();
        });
    }

    // Card number masking
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        paymentProcessor.maskCardNumber(cardNumberInput);
    }

    // Real-time validation
    initializeRealTimeValidation();
}

function initializeRealTimeValidation() {
    // Phone number validation
    const phoneInputs = document.querySelectorAll('#ecocashNumber, #innbucksNumber');
    phoneInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value && !paymentProcessor.validatePhoneNumber(this.value)) {
                this.style.borderColor = 'red';
                showFieldError(this, 'Invalid Zimbabwean number (e.g., 0771234567)');
            } else {
                this.style.borderColor = '';
                clearFieldError(this);
            }
        });
    });

    // Card validation
    const cardInputs = document.querySelectorAll('#cardNumber, #cardExpiry, #cardCVC');
    cardInputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateCardField(this);
        });
    });
}

function validateCardField(input) {
    let isValid = true;
    switch(input.id) {
        case 'cardNumber':
            const realValue = input.dataset.realValue || input.value.replace(/\D/g, '');
            isValid = paymentProcessor.validateCardNumber(realValue);
            break;
        case 'cardExpiry':
            isValid = paymentProcessor.validateExpiry(input.value);
            break;
        case 'cardCVC':
            isValid = paymentProcessor.validateCVC(input.value);
            break;
    }
    
    if (!isValid && input.value) {
        input.style.borderColor = 'red';
        showFieldError(input, `Invalid ${input.placeholder || 'card field'}`);
    } else {
        input.style.borderColor = '';
        clearFieldError(input);
    }
}

function showFieldError(input, message) {
    clearFieldError(input);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.cssText = 'color: red; font-size: 12px; margin-top: 4px;';
    errorDiv.textContent = message;
    input.parentNode.appendChild(errorDiv);
}

function clearFieldError(input) {
    const existingError = input.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();
}

function togglePaymentDetails(paymentMethod) {
    // Hide all payment details
    const allDetails = document.querySelectorAll('.payment-details');
    allDetails.forEach(detail => detail.style.display = 'none');

    // Show selected payment method details
    const detailsMap = {
        'ecocash': 'ecocashDetails',
        'innbucks': 'innbucksDetails',
        'card': 'cardDetails'
    };
    
    const detailId = detailsMap[paymentMethod];
    if (detailId) {
        const element = document.getElementById(detailId);
        if (element) element.style.display = 'block';
    }
}

function updatePaymentInstructions(paymentMethod) {
    const container = document.getElementById('paymentInstructions');
    if (!container) return;

    const instructions = {
        ecocash: `
            <div class="payment-instruction">
                <h4>💳 EcoCash Payment</h4>
                <p>Enter your EcoCash registered number. You'll receive a USSD prompt to complete payment.</p>
                <p><strong>Recipient:</strong> 0788025819</p>
            </div>
        `,
        innbucks: `
            <div class="payment-instruction">
                <h4>🏦 InnBucks Payment</h4>
                <p>Enter your InnBucks registered number. You'll receive a USSD prompt to complete payment.</p>
                <p><strong>Recipient:</strong> 0788025819</p>
            </div>
        `,
        card: `
            <div class="payment-instruction">
                <h4>💳 Card Payment</h4>
                <p>Enter your card details. Payment will be processed securely.</p>
                <p><strong>Accepted:</strong> Visa & Mastercard</p>
            </div>
        `,
        cash: `
            <div class="payment-instruction">
                <h4>💰 Cash on Delivery</h4>
                <p>Pay when you receive your order. Exact change appreciated.</p>
            </div>
        `
    };

    container.innerHTML = instructions[paymentMethod] || '';
}

async function processCheckoutPayment() {
    const form = document.getElementById('checkoutForm');
    if (!form) {
        showError('Checkout form not found');
        return;
    }

    const formData = new FormData(form);
    const paymentMethod = formData.get('paymentMethod');
    
    if (!paymentMethod) {
        showError('Please select a payment method');
        return;
    }

    // Get amount from cart total
    const totalText = document.getElementById('totalAmount')?.textContent || '0';
    const amount = parseFloat(totalText.replace(/[^0-9.-]+/g, '')) || 0;
    
    if (amount <= 0) {
        showError('Invalid order amount');
        return;
    }

    // Validate payment-specific fields
    let paymentDetails = {};
    let validationPassed = true;

    switch(paymentMethod) {
        case 'ecocash':
        case 'innbucks':
            const phoneNumber = formData.get(paymentMethod + 'Number');
            if (!paymentProcessor.validatePhoneNumber(phoneNumber)) {
                showError('Please enter a valid Zimbabwean phone number');
                validationPassed = false;
            } else {
                paymentDetails.phoneNumber = phoneNumber;
            }
            break;

        case 'card':
            const cardNumber = document.getElementById('cardNumber')?.dataset.realValue || 
                              formData.get('cardNumber').replace(/\D/g, '');
            const cardExpiry = formData.get('cardExpiry');
            const cardCVC = formData.get('cardCVC');
            const cardName = formData.get('cardName');

            if (!paymentProcessor.validateCardNumber(cardNumber)) {
                showError('Invalid card number');
                validationPassed = false;
            } else if (!paymentProcessor.validateExpiry(cardExpiry)) {
                showError('Invalid expiry date (MM/YY)');
                validationPassed = false;
            } else if (!paymentProcessor.validateCVC(cardCVC)) {
                showError('Invalid CVC');
                validationPassed = false;
            } else if (!cardName || cardName.trim().length < 2) {
                showError('Please enter cardholder name');
                validationPassed = false;
            } else {
                paymentDetails = { cardNumber, cardExpiry, cardCVC, cardName };
            }
            break;

        case 'cash':
            // No additional validation needed
            break;
    }

    if (!validationPassed) return;

    // Show processing indicator
    showProcessingIndicator(true, 'Processing payment...');

    try {
        const orderId = 'ORD-' + Date.now();
        let result;

        switch(paymentMethod) {
            case 'ecocash':
                result = await paymentProcessor.processEcoCashPayment(amount, paymentDetails.phoneNumber, orderId);
                break;

            case 'innbucks':
                result = await paymentProcessor.processInnBucksPayment(amount, paymentDetails.phoneNumber, orderId);
                break;

            case 'card':
                if (paymentDetails.cardNumber.startsWith('4')) {
                    result = await paymentProcessor.processVisaPayment(
                        amount, paymentDetails.cardNumber, paymentDetails.cardExpiry, 
                        paymentDetails.cardCVC, paymentDetails.cardName, orderId
                    );
                } else if (paymentDetails.cardNumber.startsWith('5') || paymentDetails.cardNumber.startsWith('2')) {
                    result = await paymentProcessor.processMastercardPayment(
                        amount, paymentDetails.cardNumber, paymentDetails.cardExpiry, 
                        paymentDetails.cardCVC, paymentDetails.cardName, orderId
                    );
                } else {
                    throw new Error('Unsupported card type');
                }
                break;

            case 'cash':
                result = await paymentProcessor.processCashOnDelivery(orderId, amount);
                break;
        }

        if (result && result.success) {
            // Save order and redirect
            saveOrderToLocalStorage(orderId, paymentMethod, paymentDetails.phoneNumber, amount, formData);
            showSuccess('Payment successful! Redirecting...');
            
            setTimeout(() => {
                window.location.href = `order_confirmation.html?id=${orderId}`;
            }, 2000);
        } else {
            throw new Error(result?.message || 'Payment failed');
        }

    } catch (error) {
        showError(error.message || 'Payment error occurred');
    } finally {
        showProcessingIndicator(false);
    }
}

function showProcessingIndicator(show, message = 'Processing...') {
    let indicator = document.getElementById('processingIndicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'processingIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            text-align: center;
            min-width: 200px;
        `;
        document.body.appendChild(indicator);
    }

    if (show) {
        indicator.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
            <div style="font-weight: bold; margin-bottom: 10px;">${message}</div>
            <div style="font-size: 12px; color: #666;">Please wait...</div>
        `;
        indicator.style.display = 'block';
        
        // Add overlay
        let overlay = document.getElementById('processingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'processingOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 9999;
            `;
            document.body.appendChild(overlay);
        }
    } else {
        indicator.style.display = 'none';
        const overlay = document.getElementById('processingOverlay');
        if (overlay) overlay.remove();
    }
}

function showError(message) {
    const container = document.getElementById('paymentFeedback');
    if (container) {
        container.innerHTML = `
            <div style="background: #fee; color: #c00; padding: 12px; border-radius: 5px; border: 1px solid #fcc; margin: 10px 0;">
                <strong>Error:</strong> ${message}
            </div>
        `;
        container.scrollIntoView({ behavior: 'smooth' });
    } else {
        alert('Error: ' + message);
    }
}

function showSuccess(message) {
    const container = document.getElementById('paymentFeedback');
    if (container) {
        container.innerHTML = `
            <div style="background: #efe; color: #060; padding: 12px; border-radius: 5px; border: 1px solid #cfc; margin: 10px 0;">
                <strong>Success:</strong> ${message}
            </div>
        `;
    } else {
        alert(message);
    }
}

function saveOrderToLocalStorage(orderId, paymentMethod, phoneNumber, amount, formData) {
    try {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const items = JSON.parse(localStorage.getItem('cart')) || [];

        const customer = {
            firstName: (formData.get('firstName') || '').trim(),
            lastName: (formData.get('lastName') || '').trim(),
            email: (formData.get('email') || '').trim(),
            phone: phoneNumber || '',
            address: (formData.get('address') || '').trim()
        };

        const order = {
            orderId,
            paymentMethod,
            phoneNumber,
            amount,
            items: [...items],
            customer,
            total: `$${amount.toFixed(2)}`,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));

        // Clear cart
        localStorage.removeItem('cart');
        
        // Update cart count display if exists
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) cartCount.textContent = '0';

        console.log('Order saved:', order);

    } catch (error) {
        console.error('Error saving order:', error);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PaymentProcessor, paymentProcessor };
}