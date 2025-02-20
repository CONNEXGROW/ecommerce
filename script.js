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
            <div class="product-image-container">
                <img src="${product.imageUrl}" alt="${product.name}">
            </div>
            <div class="product-details">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p>Price: ₹${product.price.toLocaleString()}</p>
                <button onclick="addToCart('${product.id}', '${product.name}', ${product.price})">Add to Cart</button>
            </div>
        `;
        productsContainer.appendChild(productDiv);
    });
}

// Search products
function searchProducts() {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;
    const searchTerm = searchInput.value.toLowerCase();
    const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) || 
        product.description.toLowerCase().includes(searchTerm)
    );
    displayProducts(filteredProducts);
}

// Add product to cart
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

// Remove product from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

// Update product quantity in cart
function updateQuantity(productId, change) {
    const item = cart.find(item => item.productId === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartUI();
        }
    }
}

// Update cart UI
function updateCartUI() {
    const cartContainer = document.getElementById("cart-container");
    const cartCount = document.getElementById("cartCount");
    
    if (cartCount) {
        // Update cart count
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    if (cartContainer) {
        // Update cart items
        if (cart.length === 0) {
            cartContainer.innerHTML = "<p>Your cart is empty.</p>";
            return;
        }
        cartContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <span>${item.name} (₹${item.price.toLocaleString()})</span>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity('${item.productId}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.productId}', 1)">+</button>
                </div>
                <span>Total: ₹${(item.price * item.quantity).toLocaleString()}</span>
                <button class="remove-btn" onclick="removeFromCart('${item.productId}')">Remove</button>
            </div>
        `).join('') + `
            <button onclick="window.location.href='delivery.html'" class="checkout-btn">Proceed to Checkout</button>
        `;
    }
}

// Checkout and initiate Razorpay payment
async function checkout() {
    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (totalAmount <= 0) {
        alert("Your cart is empty. Please add products to proceed.");
        return;
    }
    // Collect delivery information
    const deliveryInfo = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        address: document.getElementById("address").value,
    };
    // Validate delivery information
    if (!deliveryInfo.name || !deliveryInfo.email || !deliveryInfo.phone || !deliveryInfo.address) {
        alert("Please fill in all delivery details.");
        return;
    }
    // Create Razorpay order via backend
    try {
        const response = await fetch("https://ecommerce-mq4y.onrender.com/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: totalAmount }),
        });
        const data = await response.json();
        if (data.success) {
            const options = {
                key: "", // Add your Razorpay API key here
                amount: data.order.amount,
                currency: "INR",
                name: "Luxe Market",
                description: "Order Payment",
                order_id: data.order.id,
                handler: async function (response) {
                    await fetch("https://ecommerce-mq4y.onrender.com/save-order", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId: "user123",
                            products: cart,
                            totalAmount,
                            paymentId: response.razorpay_payment_id,
                            deliveryInfo,
                        }),
                    });
                    alert("Payment successful! Your order has been placed.");
                    cart = [];
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCartUI();
                    window.location.href = 'index.html';
                },
                prefill: {
                    name: deliveryInfo.name,
                    email: deliveryInfo.email,
                    contact: deliveryInfo.phone,
                },
                theme: {
                    color: "#0f172a",
                },
            };
            const rzp = new Razorpay(options);
            rzp.open();
        } else {
            alert(`Error creating order: ${data.error}`);
        }
    } catch (error) {
        console.error("Error during checkout:", error);
        alert("Checkout failed. Please try again.");
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    if (window.location.pathname.includes('index.html')) {
        fetchProducts();
    }
});

// Load Razorpay script
const script = document.createElement('script');
script.src = 'https://checkout.razorpay.com/v1/checkout.js';
document.body.appendChild(script);
