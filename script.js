
    // Declare 'cart' only once
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    let allProducts = [];

    // Fetch and display products
    async function fetchProducts() {
        try {
            const response = await fetch("https://ecommerce-mq4y.onrender.com/products");
            const data = await response.json();

            if (data.success) {
                allProducts = data.products;
                displayProducts(allProducts);
            } else {
                console.error("Error fetching products:", data.error);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    }

    function displayProducts(products) {
        const productsContainer = document.getElementById("products-container");
        if (!productsContainer) return;

        productsContainer.innerHTML = "";

        if (products.length === 0) {
            productsContainer.innerHTML = "<p>No products available.</p>";
            return;
        }

        products.forEach(product => {
            const productDiv = document.createElement("div");
            productDiv.className = "product";
            productDiv.innerHTML = `
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p>Price: ₹${product.price.toLocaleString()}</p>
                <button onclick="addToCart('${product.id}', '${product.name}', ${product.price})">Add to Cart</button>
            `;
            productsContainer.appendChild(productDiv);
        });
    }

    function addToCart(productId, name, price) {
        const existingItem = cart.find(item => item.productId === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ productId, name, price, quantity: 1 });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartUI();
    }

    function updateCartUI() {
        const cartCount = document.getElementById("cartCount");
        if (cartCount) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        updateCartUI();
        fetchProducts();
    });

