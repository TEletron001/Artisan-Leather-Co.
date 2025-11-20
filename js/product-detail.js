// Product detail page functionality
document.addEventListener('DOMContentLoaded', function() {
    loadProductDetail();
});

function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'), 10);

    if (!productId) {
        showError('Product not found');
        return;
    }

    const products = JSON.parse(localStorage.getItem('products')) || [];
    const product = products.find(p => p.id === productId);

    if (!product) {
        showError('Product not found');
        return;
    }

    renderProductDetail(product);
}

function renderProductDetail(product) {
    const container = document.getElementById('productDetailContainer');
    if (!container) return;

    // Sanitize product data
    const sanitizedName = (product.name || '').replace(/[<>]/g, '').trim();
    const sanitizedImage = (product.image || '').replace(/[<>]/g, '').trim();
    const sanitizedDescription = (product.description || '').replace(/[<>]/g, '').trim();
    const sanitizedPrice = parseFloat(product.price) || 0;
    const sanitizedStock = parseInt(product.stock) || 0;

    container.innerHTML = `
        <div class="product-detail">
            <div class="product-detail-image">
                <img src="${sanitizedImage}" alt="${sanitizedName}" class="product-image-large">
            </div>
            <div class="product-detail-info">
                <h1 class="product-detail-title">${sanitizedName}</h1>
                <p class="product-detail-price">$${sanitizedPrice.toFixed(2)}</p>
                <div class="product-detail-description">
                    <h3>Description</h3>
                    <p>${sanitizedDescription}</p>
                </div>
                <div class="product-detail-stock">
                    <span class="${sanitizedStock > 0 ? 'in-stock' : 'out-of-stock'}">
                        ${sanitizedStock > 0 ? 'In Stock' : 'Out of Stock'}
                        ${sanitizedStock > 0 ? `(${sanitizedStock} available)` : ''}
                    </span>
                </div>
                <div class="quantity-selector" style="margin: 1.5rem 0;">
                    <label for="detailQuantity" style="margin-right: 10px; font-weight: 600;">Quantity:</label>
                    <input type="number" id="detailQuantity" value="1" min="1" max="${sanitizedStock}" style="width: 70px; padding: 8px; text-align: center; border: 1px solid var(--light-brown); border-radius: var(--border-radius);">
                </div>
                <div class="product-detail-actions">
                    <button class="btn btn-primary btn-lg add-to-cart-btn" data-product-id="${product.id}"
                        ${sanitizedStock <= 0 ? 'disabled' : ''}>
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add event listener for Add to Cart button
    const addToCartBtn = container.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            if (typeof cart !== 'undefined') {
                const quantity = container.querySelector('#detailQuantity').value;
                cart.addItem(product, quantity);
                // Visual feedback
                this.classList.add('added');
                setTimeout(() => {
                    this.classList.remove('added');
                }, 2000);
            }
        });
    }
}

function showError(message) {
    const container = document.getElementById('productDetailContainer');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <h2>Product Not Found</h2>
                <p>${message}</p>
                <a href="products.html" class="btn btn-primary">Back to Products</a>
            </div>
        `;
    }
}
