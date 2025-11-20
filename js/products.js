// Products page functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeProducts();
    loadAllProducts();
    setupFilters();
    setupProductCardListeners(); // Setup event listeners for add to cart and view details
});

function initializeProducts() {
    if (!localStorage.getItem('products')) {
        const sampleProducts = [
            { id: 1, name: "Classic Bi-Fold Wallet", price: 45.00, image: "images/products/Wallet.jpg", category: "wallets", description: "Premium full-grain leather wallet with multiple card slots and cash compartment.", featured: true, stock: 25 },
            { id: 2, name: "Slim Card Holder", price: 35.00, image: "images/products/Card-Holder.jpg", category: "accessories", description: "Minimalist leather card holder perfect for everyday carry.", featured: true, stock: 40 },
            { id: 3, name: "Leather Crossbody Bag", price: 120.00, image: "images/products/Crossbodybag.jpg", category: "bags", description: "Elegant crossbody bag with adjustable strap and multiple compartments.", featured: true, stock: 15 },
            { id: 4, name: "Classic Leather Belt", price: 55.00, image: "images/products/belt.jpg", category: "belts", description: "Handcrafted genuine leather belt with polished buckle.", featured: true, stock: 30 },
            { id: 5, name: "Passport Wallet", price: 65.00, image: "images/products/passport-wallet.jpg", category: "wallets", description: "Travel organizer with passport slot and document pockets.", featured: false, stock: 20 },
            { id: 6, name: "Leather Backpack", price: 180.00, image: "images/products/backpack.jpg", category: "bags", description: "Stylish leather backpack for work and travel.", featured: false, stock: 10 },
            { id: 7, name: "Vintage Leather Briefcase", price: 250.00, image: "images/products/briefcase.jpg", category: "bags", description: "A timeless leather briefcase for the modern professional.", featured: false, stock: 8 },
            { id: 8, name: "Key Holder Organizer", price: 20.00, image: "images/products/key-holder.jpg", category: "accessories", description: "Compact leather key holder to keep your keys organized.", featured: true, stock: 50 },
            { id: 9, name: "Leather Journal Cover", price: 75.00, image: "images/products/journal.jpg", category: "accessories", description: "Handmade leather cover for your journal or notebook.", featured: false, stock: 12 },
            { id: 10, name: "Braided Leather Bracelet", price: 25.00, image: "images/products/bracelet.jpg", category: "accessories", description: "Stylish braided leather bracelet with a magnetic clasp.", featured: true, stock: 60 }
        ];
        localStorage.setItem('products', JSON.stringify(sampleProducts));
    }
}

// Helper function to render product cards
function renderProductCards(productsToRender) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    productsGrid.innerHTML = productsToRender.map(product => {
        // Sanitize product data
        const sanitizedName = (product.name || '').replace(/[<>]/g, '').trim();
        const sanitizedDescription = (product.description || '').replace(/[<>]/g, '').trim();
        const sanitizedImage = (product.image || '').replace(/[<>]/g, '').trim();
        const sanitizedPrice = parseFloat(product.price) || 0;
        const isFavourite = getFavourites().includes(product.id);

        return `
        <div class="product-card" data-category="${product.category}">
            ${isFavourite ? '<div class="favourite-indicator"><i class="fas fa-heart"></i></div>' : ''}
            <img src="${sanitizedImage}" alt="${sanitizedName}" class="product-image">
            <div class="product-hover-overlay">
                <button class="hover-icon view-details-hover" data-product-id="${product.id}" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="hover-icon add-favourite-hover ${isFavourite ? 'favourited' : ''}" data-product-id="${product.id}" title="Add to Favourites">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
            <div class="product-info">
                <h3 class="product-title">${sanitizedName}</h3>
                <p class="product-description">${sanitizedDescription}</p>
                <p class="product-price">$${sanitizedPrice.toFixed(2)}</p>
                <div class="product-actions">
                    <button class="btn btn-primary btn-sm add-to-cart-btn" data-product-id="${product.id}">
                        <span>Add to Cart</span>
                    </button>
                    <button class="btn btn-outline btn-sm view-details-btn" data-product-id="${product.id}">
                        <span>View Details</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

function loadAllProducts() {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    // Sort by category then name for consistent grouping
    const sortedProducts = products.slice().sort((a, b) => {
        const cat = a.category.localeCompare(b.category);
        return cat !== 0 ? cat : a.name.localeCompare(b.name);
    });

    renderProductCards(sortedProducts);
    const sortEl = document.getElementById('sortFilter');
    if (sortEl) sortEl.value = 'name'; // default
    filterProducts(); // Apply initial filter if any
}

function setupFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }

    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            sortProducts();
        });
    }
}

function filterProducts() {
    const categoryEl = document.getElementById('categoryFilter');
    const category = categoryEl ? categoryEl.value : 'all';
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category') || '';
        if (category === 'all' || category === '' || cardCategory === category) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function sortProducts() {
    const sortValue = document.getElementById('sortFilter')?.value || 'name';
    const products = JSON.parse(localStorage.getItem('products')) || [];
    let sorted = products.slice();

    switch (sortValue) {
        case 'price-asc':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'name':
        default:
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }

    renderProductCards(sorted);
    // Re-apply category filter after sorting
    filterProducts();
}

function setupProductCardListeners() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    productsGrid.addEventListener('click', function(event) {
        const products = JSON.parse(localStorage.getItem('products')) || [];

        // Handle "View Details" button clicks
        const viewDetailsButton = event.target.closest('.view-details-btn');
        if (viewDetailsButton) {
            const productId = parseInt(viewDetailsButton.getAttribute('data-product-id'), 10);
            const product = products.find(p => p.id === productId);
            if (product) {
                openQuickView(product);
            }
            return;
        }

        // Handle "Add to Favourites" button clicks
        if (event.target.closest('.add-favourite-hover')) {
            const button = event.target.closest('.add-favourite-hover');
            const productId = parseInt(button.dataset.productId);
            // Use the global toggleFavourite function from main.js
            if (typeof toggleFavourite === 'function') {
                toggleFavourite(productId, button);
                // Re-render products to update favourite indicators on this page
                setTimeout(() => loadAllProducts(), 100); // Use a small delay
            }
            return;
        }

        // Handle "Add to Cart" button clicks
        const addToCartButton = event.target.closest('.add-to-cart-btn');
        if (addToCartButton) {
            const productId = parseInt(addToCartButton.getAttribute('data-product-id'), 10);
            const product = products.find(p => p.id === productId);
            if (product && window.cart) {
                window.cart.addItem(product);
                // Visual feedback
                addToCartButton.classList.add('added');
                const originalContent = addToCartButton.innerHTML;
                addToCartButton.innerHTML = '<span>Added to cart</span>';
                addToCartButton.disabled = true;
                setTimeout(() => {
                    addToCartButton.classList.remove('added');
                    addToCartButton.innerHTML = originalContent;
                    addToCartButton.disabled = false;
                }, 2000);
            }
        }
    });
}

function openQuickView(product) {
    // Sanitize product data for modal
    const sanitizedName = (product.name || '').replace(/[<>]/g, '').trim();
    const sanitizedDescription = (product.description || '').replace(/[<>]/g, '').trim();
    const sanitizedImage = (product.image || '').replace(/[<>]/g, '').trim();
    const sanitizedPrice = parseFloat(product.price) || 0;
    const sanitizedStock = parseInt(product.stock) || 0;

    // Create modal content
    const modalContent = `
        <div class="quick-view-modal">
            <div class="quick-view-content">
                <button class="close-modal"><i class="fas fa-times"></i></button>
                <div class="product-details">
                    <div class="product-image">
                        <img src="${sanitizedImage}" alt="${sanitizedName}">
                    </div>
                    <div class="product-info">
                        <h2>${sanitizedName}</h2>
                        <p class="price">$${sanitizedPrice.toFixed(2)}</p>
                        <p class="description">${sanitizedDescription}</p>
                        <div class="stock-info">
                            <span class="${sanitizedStock > 0 ? 'in-stock' : 'out-of-stock'}">
                                ${sanitizedStock > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                            ${sanitizedStock > 0 ? `(${sanitizedStock} available)` : ''}
                        </div>
                        <div class="quantity-selector" style="margin-top: 1.5rem; text-align: center;">
                            <label for="modalQuantity" style="margin-right: 10px; font-weight: 600;">Quantity:</label>
                            <input type="number" id="modalQuantity" value="1" min="1" max="${sanitizedStock}" style="width: 60px; padding: 5px; text-align: center; border: 1px solid var(--light-brown); border-radius: var(--border-radius);">
                        </div>
                        <div class="actions" style="text-align: center;">
                            <button class="btn btn-primary modal-add-to-cart" data-product-id="${product.id}"
                                ${sanitizedStock <= 0 ? 'disabled' : ''}>
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add modal to page
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalContent.trim();
    const modalElement = modalContainer.firstChild;
    document.body.appendChild(modalElement);

    // Add event listeners
    const closeBtn = modalElement.querySelector('.close-modal');
    const addToCartBtn = modalElement.querySelector('.modal-add-to-cart');

    // Close button handler
    if (closeBtn) {
        closeBtn.addEventListener('click', () => modalElement.remove());
    }
    // Add to cart button handler
    addToCartBtn.addEventListener('click', function() {
        if (window.cart) {
            const quantity = modalElement.querySelector('#modalQuantity').value;
            window.cart.addItem(product, quantity);
            // Visual feedback
            this.classList.add('added');
            const originalContent = this.innerHTML;
            this.innerHTML = '<span>Added to cart</span>';
            this.disabled = true;
            setTimeout(() => {
                this.classList.remove('added');
                this.innerHTML = originalContent;
                this.disabled = false;
            }, 2000);
        }
    });

    // Close on outside click
    modalElement.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

// Add CSS for quick view modal and hover effects if not already present
if (!document.getElementById('quick-view-styles')) {
    const styles = document.createElement('style');
    styles.id = 'quick-view-styles';
    styles.textContent = `
        .quick-view-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .quick-view-content {
            background: white;
            padding: 2rem;
            border-radius: var(--border-radius);
            max-width: 900px;
            width: 90%;
            position: relative;
            max-height: 90vh;
            overflow-y: auto;
        }

        .close-modal {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--dark-brown);
        }

        .product-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }

        .product-image img {
            width: 100%;
            height: auto;
            border-radius: var(--border-radius);
        }

        .product-info h2 {
            color: var(--dark-brown);
            margin-bottom: 1rem;
        }

        .price {
            font-size: 1.5rem;
            color: var(--accent-gold);
            font-weight: bold;
            margin-bottom: 1rem;
        }

        .description {
            margin-bottom: 1.5rem;
            line-height: 1.6;
        }

        .stock-info {
            margin-bottom: 1.5rem;
        }

        .in-stock {
            color: var(--success);
        }

        .out-of-stock {
            color: var(--error);
        }

        .modal-footer {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid var(--light-gray);
            text-align: center;
        }

        /* --- Product Hover Overlay --- */
        .product-hover-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            border-radius: var(--border-radius);
        }

        .product-card:hover .product-hover-overlay {
            opacity: 1;
            visibility: visible;
        }

        .hover-icon {
            background: var(--white);
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1.2rem;
            color: var(--dark-brown);
        }

        .hover-icon:hover {
            background: var(--accent-gold);
            color: var(--white);
            transform: scale(1.1);
        }

        .hover-icon.favourited {
            background: var(--accent-gold);
            color: var(--white);
        }

        .hover-icon.favourited:hover {
            background: var(--accent-gold-dark);
        }

        @media (max-width: 768px) {
            .quick-view-content {
                padding: 1rem;
            }

            .product-details {
                grid-template-columns: 1fr;
            }
        }
    `;
    document.head.appendChild(styles);
}
