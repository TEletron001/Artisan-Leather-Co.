// Preloader logic
window.addEventListener('load', () => {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        preloader.classList.add('hidden');
    }
});

// DOM Content Loaded for other scripts
document.addEventListener('DOMContentLoaded', function() {
    // Initialize products if not present
    initializeProducts();
    // Load featured products
    loadFeaturedProducts();
    // Update category counts on the homepage
    updateCategoryCounts();
    
    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', toggleMenu);
        menuToggle.addEventListener('touchstart', toggleMenu);

        function toggleMuenu(event){
            event.preventDefault();
            navLinks.classList.toggle('active')
            console.log('Menu toggleg!');
        }
    } else{
        console.error('Menu toggle elements not found!');
    }
});

    // Cart sidebar functionality is in cart.js, which is included on all pages.
    const cartButton = document.getElementById('cartButton');
    const closeCart = document.getElementById('closeCart');
    const cartSidebar = document.getElementById('cartSidebar');

    if (cartButton && cartSidebar) {
        cartButton.addEventListener('click', () => {
            cartSidebar.classList.add('active');
        });
    }

    if (closeCart && cartSidebar) {
        closeCart.addEventListener('click', () => {
            cartSidebar.classList.remove('active');
        });
    }

    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
        if (cartSidebar && cartSidebar.classList.contains('active') &&
            !cartSidebar.contains(e.target) &&
            e.target !== cartButton && !cartButton.contains(e.target)) {
            if (window.preventCartClose) {
                window.preventCartClose = false; // Reset the flag
            } else {
                cartSidebar.classList.remove('active');
            }
        }
    });

    // Hero Carousel
    const carousel = document.getElementById('heroCarousel');
    if (carousel) {
        const slides = carousel.querySelectorAll('.carousel-slide');
        const navContainer = carousel.querySelector('.carousel-nav');
        let currentSlide = 0;

        slides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.classList.add('carousel-dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => showSlide(i));
            navContainer.appendChild(dot);
        });

        const dots = navContainer.querySelectorAll('.carousel-dot');

        function showSlide(index) {
            slides[currentSlide].classList.remove('active');
            dots[currentSlide].classList.remove('active');
            currentSlide = index;
            slides[currentSlide].classList.add('active');
            dots[currentSlide].classList.add('active');
        }

        setInterval(() => showSlide((currentSlide + 1) % slides.length), 5000); // Auto-play every 5 seconds
    }

    initializeProductListeners();
});

// Load featured products
function loadFeaturedProducts() {
    const featuredContainer = document.getElementById('featuredProducts');
    if (!featuredContainer) return;
    const products = JSON.parse(localStorage.getItem('products')) || [];

    let featuredProducts = products.filter(product => product.featured);

    // Sort by category first, then by name, to group similar items
    featuredProducts.sort((a, b) => {
        return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
    });

    // Sanitize product data
    featuredContainer.innerHTML = featuredProducts.map(product => {
        const sanitizedName = (product.name || '').replace(/[<>]/g, '').trim();
        const sanitizedImage = (product.image || '').replace(/[<>]/g, '').trim();
        const sanitizedPrice = parseFloat(product.price) || 0;
        const isFavourite = getFavourites().includes(product.id);

        return `
        <div class="product-card">
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
                <p class="product-price">$${sanitizedPrice.toFixed(2)}</p>
                <div class="product-actions">
                    <button class="btn btn-primary btn-sm add-to-cart-btn" data-product-id="${product.id}">
                        <span>Add to Cart</span>
                    </button>
                    <button class="btn btn-outline btn-sm view-details-btn" data-product-id="${product.id}">View Details</button>
                </div>
            </div>
        </div>
    `}).join('');

    // Add event listeners to the new buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        // Check if listener already exists to avoid duplicates
        if (button.dataset.listenerAttached) return;
        button.dataset.listenerAttached = 'true';

        button.addEventListener('click', function(e) {
            const productId = this.dataset.productId;
            const product = products.find(p => p.id == productId);
            if (product) {
                cart.addItem(product);

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
    });
}

function initializeProductListeners() {
    // Use event delegation on the body to handle clicks on dynamically added buttons
    document.body.addEventListener('click', function(event) {
        const products = JSON.parse(localStorage.getItem('products')) || [];

        // Handle "View Details"
        if (event.target.classList.contains('view-details-btn') || event.target.closest('.view-details-hover')) {
            const productId = event.target.dataset.productId || event.target.closest('.view-details-hover').dataset.productId;
            const product = products.find(p => p.id == productId);
            if (product) {
                openQuickView(product);
            }
        }

        // Handle "Add to Favourites"
        if (event.target.closest('.add-favourite-hover')) {
            const button = event.target.closest('.add-favourite-hover');
            const productId = parseInt(button.dataset.productId);
            toggleFavourite(productId, button);
        }
    });
}

function openQuickView(product) {
    // Sanitize product data for modal
    const sanitizedName = (product.name || '').replace(/[<>]/g, '').trim();
    const sanitizedImage = (product.image || '').replace(/[<>]/g, '').trim();
    const sanitizedDescription = (product.description || '').replace(/[<>]/g, '').trim();
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
                        <div class="actions" style="margin-top: 1.5rem; text-align: center;">
                            <button class="btn btn-primary modal-add-to-cart-btn" data-product-id="${product.id}"
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

    // Add event listeners for modal elements
    const closeModalBtn = modalElement.querySelector('.close-modal');
    const addToCartBtn = modalElement.querySelector('.modal-add-to-cart-btn');

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => modalElement.remove());
    }

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            if (window.cart) {
                const quantity = modalElement.querySelector('#modalQuantity').value;
                window.cart.addItem(product, quantity);
                const originalContent = this.innerHTML;
                this.classList.add('added');
                this.innerHTML = '<span>Added to cart</span>';
                this.disabled = true;
                setTimeout(() => {
                    this.classList.remove('added');
                    this.innerHTML = originalContent;
                    this.disabled = false;
                }, 2000);
            }
        });
    }

    // Close modal when clicking outside
    modalElement.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

function initializeProducts() {
    if (!localStorage.getItem('products')) {
        const sampleProducts = [
            { id: 1, name: "Classic Bi-Fold Wallet", price: 45.00, image: "images/products/Wallet.jpg", category: "wallets", description: "Premium full-grain leather wallet with multiple card slots and cash compartment.", featured: true, stock: 25, priceDisplay: "$45.00" },
            { id: 2, name: "Slim Card Holder", price: 35.00, image: "images/products/Card-Holder.jpg", category: "wallets", description: "Minimalist leather card holder perfect for everyday carry.", featured: true, stock: 40, priceDisplay: "$35.00" },
            { id: 3, name: "Leather Crossbody Bag", price: 120.00, image: "images/products/Crossbodybag.jpg", category: "bags", description: "Elegant crossbody bag with adjustable strap and multiple compartments.", featured: true, stock: 15, priceDisplay: "$120.00" },
            { id: 4, name: "Classic Leather Belt", price: 55.00, image: "images/products/Belt.jpg", category: "belts", description: "Handcrafted genuine leather belt with polished buckle.", featured: true, stock: 30, priceDisplay: "$55.00" },
            { id: 5, name: "Passport Wallet", price: 65.00, image: "images/products/Passport-Wallet.jpg", category: "wallets", description: "Travel organizer with passport slot and document pockets.", featured: false, stock: 20, priceDisplay: "$65.00" },
            { id: 6, name: "Leather Backpack", price: 180.00, image: "images/products/Backpack.jpg", category: "bags", description: "Stylish leather backpack for work and travel.", featured: false, stock: 10, priceDisplay: "$180.00" },
            { id: 7, name: "Vintage Leather Briefcase", price: 250.00, image: "images/products/Briefcase.jpg", category: "bags", description: "A timeless leather briefcase for the modern professional.", featured: false, stock: 8, priceDisplay: "$250.00" },
            { id: 8, name: "Key Holder Organizer", price: 20.00, image: "images/products/Key-holder.jpg", category: "accessories", description: "Compact leather key holder to keep your keys organized.", featured: true, stock: 50, priceDisplay: "$20.00" },
            { id: 9, name: "Leather Journal Cover", price: 75.00, image: "images/products/Journal.jpg", category: "accessories", description: "Handmade leather cover for your journal or notebook.", featured: false, stock: 12, priceDisplay: "$75.00" },
            { id: 10, name: "Braided Leather Bracelet", price: 25.00, image: "images/products/Bracelet.jpg", category: "accessories", description: "Stylish braided leather bracelet with a magnetic clasp.", featured: true, stock: 60, priceDisplay: "$25.00" }
        ];
        localStorage.setItem('products', JSON.stringify(sampleProducts));
    }
}

// Favourites functionality
function getFavourites() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user) {
        return []; // No user, no favourites
    }
    const favouritesKey = `favourites_${user.email}`;
    return JSON.parse(sessionStorage.getItem(favouritesKey)) || [];
}

function saveFavourites(favourites) {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user) {
        return; // Can't save favourites for a non-logged-in user
    }
    const favouritesKey = `favourites_${user.email}`;
    sessionStorage.setItem(favouritesKey, JSON.stringify(favourites));
}

function toggleFavourite(productId, button) {
    const favourites = getFavourites();
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const product = products.find(p => p.id === productId);
    const index = favourites.indexOf(productId);    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;

    if (index > -1) {
        // Remove from favourites
        favourites.splice(index, 1);
        button.classList.remove('favourited');
    } else {
        // Add to favourites
        if (!user) {
            alert('Please log in to save your favourites.');
            return;
        }
        favourites.push(productId);
        button.classList.add('favourited');
        if (product) {
            showFavouriteNotification(product.name);
        }
    }

    saveFavourites(favourites);

    // If on the favourites page, reload the items
    if (document.getElementById('favouritesContainer')) {
        if (typeof loadFavouritesPage === 'function') {
            loadFavouritesPage();
        }
    }
}

// Function to show a notification when an item is added to favourites
function showFavouriteNotification(productName) {
    const notification = document.createElement('div');
    notification.className = 'favourite-notification';
    notification.innerHTML = `
        <i class="fas fa-heart"></i>
        <span>"${productName}" has been added to favourites.</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10); // Add 'show' class after a tiny delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300); // Remove from DOM after transition
    }, 3000);
}

// Add CSS for quick view modal and hover effects if not already present
if (!document.getElementById('quick-view-styles')) {
    const styles = document.createElement('style');
    styles.id = 'quick-view-styles';
    styles.textContent = `
        .quick-view-modal {
            /* ... existing styles ... */
        }

        /* --- Favourite Notification --- */
        .favourite-notification {
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--accent-gold);
            color: var(--white);
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 600;
            z-index: 1002;
            transform: translateX(calc(100% + 20px));
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .favourite-notification.show {
            transform: translateX(0);
            opacity: 1;
        }

        .favourite-notification i {
            font-size: 1.2rem;
        }

        @media (max-width: 768px) {
            .favourite-notification {
                top: auto;
                bottom: 20px;
            }
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

        /* --- Cart Item Styles --- */
        .cart-item {
            display: flex;
            gap: 1rem;
            padding: 1rem 0;
            border-bottom: 1px solid var(--light-brown);
        }

        .cart-item:last-child {
            border-bottom: none;
        }

        .cart-item-img-wrapper {
            flex-shrink: 0;
            width: 80px;
            height: 80px;
        }

        .cart-item-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: var(--border-radius);
        }

        .cart-item-info {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .cart-item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 0.5rem;
        }

        .cart-item-title {
            font-weight: 600;
            color: var(--dark-brown);
            line-height: 1.3;
        }

        .cart-item-remove {
            background: none;
            border: none;
            font-size: 1.5rem;
            line-height: 1;
            color: var(--gray);
            cursor: pointer;
            padding: 0;
        }

        .cart-item-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 0.5rem;
        }

        .cart-item-quantity {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .cart-item-price {
            font-weight: 600;
            color: var(--dark-brown);
        }

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

function updateCategoryCounts() {
    const categoryGrid = document.querySelector('.category-grid');
    if (!categoryGrid) return; // Only run on homepage

    const products = JSON.parse(localStorage.getItem('products')) || [];

    // Count products in each category
    const counts = products.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + (product.stock || 0);
        return acc;
    }, {});

    // Update the HTML
    const categoryCards = categoryGrid.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        const h3 = card.querySelector('h3');
        const countElement = card.querySelector('.category-count');
        if (h3 && countElement) {
            const categoryName = h3.textContent.toLowerCase();
            const count = counts[categoryName] || 0;
            countElement.textContent = `${count} Item${count !== 1 ? 's' : ''} in Stock`;
        }
    });
}


