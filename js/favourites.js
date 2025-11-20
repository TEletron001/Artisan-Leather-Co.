// Favourites page functionality
document.addEventListener('DOMContentLoaded', function() {
    loadFavouritesPage();
});

function loadFavouritesPage() {
    const favouritesContainer = document.getElementById('favouritesContainer');
    const emptyFavourites = document.getElementById('emptyFavourites');

    if (!favouritesContainer) return;

    const favourites = getFavourites();
    const products = JSON.parse(localStorage.getItem('products')) || [];

    if (favourites.length === 0) {
        emptyFavourites.style.display = 'block';
        favouritesContainer.style.display = 'none';
        return;
    }

    emptyFavourites.style.display = 'none';
    favouritesContainer.style.display = 'grid';

    // Filter products to only show favourites
    const favouriteProducts = products.filter(product => favourites.includes(product.id));

    // Sort by category first, then by name
    favouriteProducts.sort((a, b) => {
        return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
    });

    // Render favourite products
    favouritesContainer.innerHTML = favouriteProducts.map(product => {
        const sanitizedName = (product.name || '').replace(/[<>]/g, '').trim();
        const sanitizedImage = (product.image || '').replace(/[<>]/g, '').trim();
        const sanitizedPrice = parseFloat(product.price) || 0;

        return `
        <div class="product-card">
            <div class="favourite-indicator"><i class="fas fa-heart"></i></div>
            <img src="${sanitizedImage}" alt="${sanitizedName}" class="product-image">
            <div class="product-hover-overlay">
                <button class="hover-icon view-details-hover" data-product-id="${product.id}" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="hover-icon add-favourite-hover favourited" data-product-id="${product.id}" title="Remove from Favourites">
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

    // Add event listeners
    initializeFavouritesListeners();
    initializeAddToCartListeners();
}

function initializeFavouritesListeners() {
    // Handle "View Details" and "Remove from Favourites" on favourites page
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

        // Handle "Remove from Favourites"
        if (event.target.closest('.add-favourite-hover')) {
            const button = event.target.closest('.add-favourite-hover');
            const productId = parseInt(button.dataset.productId);
            removeFromFavourites(productId);
            // Reload the favourites page
            loadFavouritesPage();
        }
    });
}

function initializeAddToCartListeners() {
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        if (button.dataset.listenerAttached) return;
        button.dataset.listenerAttached = 'true';

        button.addEventListener('click', function(e) {
            const productId = this.dataset.productId;
            const products = JSON.parse(localStorage.getItem('products')) || [];
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

function removeFromFavourites(productId) {
    const favourites = getFavourites();
    const index = favourites.indexOf(productId);
    if (index > -1) {
        favourites.splice(index, 1);
        saveFavourites(favourites); // This will now use the session-based save
    }
}
