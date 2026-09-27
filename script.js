/* ================= EASY SETTINGS ================= */

const ADMIN_USERNAME = "ADMIN";
const ADMIN_PASSWORD = "mycanna69";

/*
    EMAIL UPDATE SETUP

    This website can prepare email updates, but a plain HTML file cannot
    send automatic emails by itself.

    To make real automatic emails work, connect a backend/email provider
    and call sendOrderEmailUpdate(order) from updateOrderStatus().

    Keep private server/API secrets out of this file.
*/

const STORAGE = {
    users: "bingUsers",
    pending: "bingPending",
    products: "bingProducts",
    orders: "bingOrders",
    session: "bingSession",
    cart: "bingCart"
};

const DEFAULT_USERS = [
    {
        name: "Demo Customer",
        email: "customer@bingchillin.com",
        password: "123456"
    }
];

const DEFAULT_PRODUCTS = [
    {
        id: 1,
        name: "Moss Plant",
        pricePerKg: 350,
        category: "Plants",
        image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80",
        description: "A beautiful green plant for your home.",
        stockKg: 20
    },
    {
        id: 2,
        name: "Mini Fern",
        pricePerKg: 280,
        category: "Plants",
        image: "https://images.unsplash.com/photo-1520412099551-62b6bafeb9bb?auto=format&fit=crop&w=800&q=80",
        description: "A small and easy-to-display fern.",
        stockKg: 20
    },
    {
        id: 3,
        name: "Ceramic Plant Pot",
        pricePerKg: 180,
        category: "Pots",
        image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80",
        description: "A simple pot for your favorite plant.",
        stockKg: 20
    },
    {
        id: 4,
        name: "Garden Starter Set",
        pricePerKg: 520,
        category: "Tools",
        image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80",
        description: "Basic gardening tools for beginners.",
        stockKg: 20
    }
];

let USERS = loadData(STORAGE.users, DEFAULT_USERS);
let PENDING = loadData(STORAGE.pending, []);
let PRODUCTS = loadData(STORAGE.products, DEFAULT_PRODUCTS);
let ORDERS = loadData(STORAGE.orders, []);
let USER = null;
let CART = loadData(STORAGE.cart, []);

function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);

        if (saved !== null) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.warn("Could not load", key, error);
    }

    return JSON.parse(JSON.stringify(fallback));
}

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function saveAll() {
    saveData(STORAGE.users, USERS);
    saveData(STORAGE.pending, PENDING);
    saveData(STORAGE.products, PRODUCTS);
    saveData(STORAGE.orders, ORDERS);
    saveData(STORAGE.cart, CART);
}

function authTab(tab) {
    ["login", "register", "forgot"].forEach((id) => {
        document.getElementById(id).classList.toggle("hidden", id !== tab);
    });

    document.getElementById("lt").classList.toggle("primary", tab === "login");
    document.getElementById("rt").classList.toggle("primary", tab === "register");
}

function msg(id, text, isError = false) {
    document.getElementById(id).innerHTML =
        '<div class="msg ' +
        (isError ? "err" : "") +
        '">' +
        esc(text) +
        "</div>";
}

function showShop() {
    auth.classList.add("hidden");
    shop.classList.remove("hidden");

    welcome.textContent =
        "Welcome, " +
        USER.name +
        "! Browse our products and add items to your cart.";

    render();
    updateCartCount();
}

function login(event) {
    event.preventDefault();

    const email = le.value.trim().toLowerCase();

    const user = USERS.find(
        (candidate) =>
            candidate.email === email &&
            candidate.password === lp.value
    );

    if (!user) {
        return msg("lm", "Incorrect email or password.", true);
    }

    USER = user;

    localStorage.setItem(STORAGE.session, user.email);

    if (remember.checked) {
        localStorage.setItem("bingRemember", user.email);
    } else {
        localStorage.removeItem("bingRemember");
    }

    CART = loadCartForUser(user.email);

    showShop();
}

function register(event) {
    event.preventDefault();

    const name = rn.value.trim();
    const email = re.value.trim().toLowerCase();

    if (rp.value !== rp2.value) {
        return msg("rm", "Passwords do not match.", true);
    }

    if (
        USERS.some((user) => user.email === email) ||
        PENDING.some((user) => user.email === email)
    ) {
        return msg(
            "rm",
            "That email is already registered or pending approval.",
            true
        );
    }

    PENDING.push({
        name,
        email,
        password: rp.value
    });

    saveData(STORAGE.pending, PENDING);

    event.target.reset();

    msg(
        "rm",
        "Registration submitted. Wait for owner approval before logging in."
    );
}

function forgot(event) {
    event.preventDefault();

    const user = USERS.find(
        (candidate) =>
            candidate.email === fe.value.trim().toLowerCase()
    );

    if (!user) {
        return msg("fm", "Account not found or not approved.", true);
    }

    user.password = fp.value;

    saveData(STORAGE.users, USERS);

    msg("fm", "Password changed successfully.");
}

function logout() {
    saveCurrentCart();

    USER = null;

    localStorage.removeItem(STORAGE.session);

    shop.classList.add("hidden");
    auth.classList.remove("hidden");

    authTab("login");
}

function restoreSession() {
    const email = localStorage.getItem(STORAGE.session);

    if (!email) {
        authTab("login");
        return;
    }

    const user = USERS.find(
        (candidate) => candidate.email === email
    );

    if (!user) {
        localStorage.removeItem(STORAGE.session);
        authTab("login");
        return;
    }

    USER = user;
    CART = loadCartForUser(user.email);

    showShop();
}

function loadCartForUser(email) {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE.cart + ":" + email)
        );

        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

function saveCurrentCart() {
    if (!USER) {
        return;
    }

    localStorage.setItem(
        STORAGE.cart + ":" + USER.email,
        JSON.stringify(CART)
    );

    saveData(STORAGE.cart, CART);
}

function render() {
    const query = search.value.toLowerCase();
    const selectedCategory = cat.value;

    const categories = [
        ...new Set(PRODUCTS.map((product) => product.category))
    ];

    cat.innerHTML =
        '<option value="">All Categories</option>' +
        categories
            .map(
                (category) =>
                    "<option>" + esc(category) + "</option>"
            )
            .join("");

    cat.value = selectedCategory;

    const filteredProducts = PRODUCTS.filter(
        (product) =>
            (
                product.name +
                " " +
                product.description +
                " " +
                product.category
            )
                .toLowerCase()
                .includes(query) &&
            (!selectedCategory ||
                product.category === selectedCategory)
    );

    products.innerHTML =
        filteredProducts
            .map(
                (product) => `
                    <article class="product">
                        <img src="${esc(product.image)}" alt="${esc(product.name)}">

                        <h3>${esc(product.name)}</h3>

                        <div class="muted">${esc(product.category)}</div>

                        <p>${esc(product.description)}</p>

                        <div class="price">
                            ₱${Number(product.pricePerKg).toLocaleString(
                                "en-PH",
                                {
                                    minimumFractionDigits: 2
                                }
                            )} / kg
                        </div>

                        <div class="stock">
                            Stock: ${formatWeight(product.stockKg)}
                        </div>

                        <div class="weight-picker">
                            <input
                                id="weight-${product.id}"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value="1"
                            >

                            <select id="unit-${product.id}">
                                <option value="kg">kilogram (kg)</option>
                                <option value="g">grams (g)</option>
                                <option value="oz">ounces (oz)</option>
                            </select>
                        </div>

                        <button
                            class="primary full-width"
                            onclick="addProduct(${product.id})"
                        >
                            🛒 Add to Cart
                        </button>
                    </article>
                `
            )
            .join("") || "<p>No products found.</p>";
}

function addProduct(id) {
    const product = PRODUCTS.find((item) => item.id === id);

    if (!product) {
        return;
    }

    const amount = Number(
        document.getElementById("weight-" + id).value
    );

    const unit = document.getElementById("unit-" + id).value;

    if (!amount || amount <= 0) {
        return alert("Please enter a valid quantity.");
    }

    const kg = toKg(amount, unit);

    if (kg > Number(product.stockKg)) {
        return alert(
            "There is not enough stock for that quantity. Available: " +
            formatWeight(product.stockKg)
        );
    }

    CART.push({
        id,
        amount,
        unit,
        kg
    });

    saveCurrentCart();
    updateCartCount();

    alert(
        "Added " +
        formatWeight(amount, unit) +
        " of " +
        product.name +
        " to your cart."
    );
}

function toKg(amount, unit) {
    if (unit === "g") {
        return amount / 1000;
    }

    if (unit === "oz") {
        return amount * 0.028349523125;
    }

    return amount;
}

function formatWeight(amount, unit = "kg") {
    const value = Number(amount);

    if (unit === "g") {
        return value.toFixed(2) + " g";
    }

    if (unit === "oz") {
        return value.toFixed(2) + " oz";
    }

    if (value >= 1) {
        return value.toFixed(2) + " kg";
    }

    return (value * 1000).toFixed(0) + " g";
}

function cartOpen() {
    if (!CART.length) {
        return alert("Your cart is empty.");
    }

    let sum = 0;

    cartItems.innerHTML = CART
        .map((item, index) => {
            const product = PRODUCTS.find(
                (productItem) => productItem.id === item.id
            );

            if (!product) {
                return "";
            }

            const itemTotal =
                Number(product.pricePerKg) * Number(item.kg);

            sum += itemTotal;

            return `
                <div class="line cart-line">
                    <span>
                        <b>${esc(product.name)}</b><br>
                        ${formatWeight(item.amount, item.unit)}
                        <br>
                        ₱${itemTotal.toLocaleString("en-PH", {
                            minimumFractionDigits: 2
                        })}
                    </span>

                    <span>
                        <button onclick="removeCartItem(${index})">Remove</button>
                    </span>
                </div>
            `;
        })
        .join("");

    total.textContent =
        "Total: ₱" +
        sum.toLocaleString("en-PH", {
            minimumFractionDigits: 2
        });

    openM("cart");
}

function removeCartItem(index) {
    CART.splice(index, 1);

    saveCurrentCart();
    updateCartCount();

    if (CART.length) {
        cartOpen();
    } else {
        closeM("cart");
    }
}

function updateCartCount() {
    count.textContent = CART.length;
}

function checkout() {
    if (!USER) {
        return;
    }

    closeM("cart");

    on.value = USER.name;
    oe.value = USER.email;

    openM("checkout");
}

function order(event) {
    event.preventDefault();

    if (!USER || !CART.length) {
        return;
    }

    let totalAmount = 0;

    const items = CART
        .map((cartItem) => {
            const product = PRODUCTS.find(
                (item) => item.id === cartItem.id
            );

            if (!product) {
                return null;
            }

            const lineTotal =
                Number(product.pricePerKg) * Number(cartItem.kg);

            totalAmount += lineTotal;

            return {
                productId: product.id,
                productName: product.name,
                amount: cartItem.amount,
                unit: cartItem.unit,
                kg: cartItem.kg,
                pricePerKg: Number(product.pricePerKg),
                lineTotal
            };
        })
        .filter(Boolean);

    const orderId =
        "BC-" +
        Date.now().toString(36).toUpperCase();

    const newOrder = {
        id: orderId,
        customerName: on.value.trim(),
        customerEmail: oe.value.trim().toLowerCase(),
        customerPhone: op.value.trim(),
        address: oa.value.trim(),
        payment: pay.value,
        items,
        total: totalAmount,
        status: "Order Received",
        location: "Order received by bingchillin",
        createdAt: new Date().toISOString(),
        updates: [
            {
                status: "Order Received",
                location: "Order received by bingchillin",
                time: new Date().toISOString()
            }
        ]
    };

    ORDERS.unshift(newOrder);

    items.forEach((item) => {
        const product = PRODUCTS.find(
            (productItem) => productItem.id === item.productId
        );

        if (product) {
            product.stockKg = Math.max(
                0,
                Number(product.stockKg) - Number(item.kg)
            );
        }
    });

    CART = [];

    saveAll();
    updateCartCount();
    render();

    msg(
        "om",
        "Order " +
            orderId +
            " placed successfully using " +
            pay.value +
            ". You can track it in My Orders."
    );

    setTimeout(() => {
        closeM("checkout");
        ordersOpen();
    }, 1600);
}

function ordersOpen() {
    renderMyOrders();
    openM("orders");
}

function renderMyOrders() {
    const myOrders = ORDERS.filter(
        (orderItem) =>
            orderItem.customerEmail === USER.email
    );

    if (!myOrders.length) {
        myOrders.innerHTML = "";
        return;
    }

    document.getElementById("myOrders").innerHTML =
        myOrders
            .map(
                (orderItem) => `
                    <div class="order-card">
                        <div class="order-top">
                            <b>${esc(orderItem.id)}</b>
                            <span class="status">${esc(orderItem.status)}</span>
                        </div>

                        <div class="muted">
                            ${new Date(
                                orderItem.createdAt
                            ).toLocaleString()}
                        </div>

                        <p>
                            <b>Current location:</b>
                            ${esc(orderItem.location)}
                        </p>

                        <p>
                            <b>Total:</b>
                            ₱${Number(orderItem.total).toLocaleString(
                                "en-PH",
                                {
                                    minimumFractionDigits: 2
                                }
                            )}
                        </p>

                        <div class="timeline">
                            ${
                                orderItem.updates
                                    .map(
                                        (update) => `
                                            <div class="timeline-item">
                                                <b>${esc(update.status)}</b>
                                                <br>
                                                ${esc(update.location)}
                                                <br>
                                                <small>
                                                    ${new Date(
                                                        update.time
                                                    ).toLocaleString()}
                                                </small>
                                            </div>
                                        `
                                    )
                                    .join("")
                            }
                        </div>
                    </div>
                `
            )
            .join("");
}

/* ================= HIDDEN ADMIN ACCESS ================= */

document.addEventListener("keydown", (event) => {
    if (
        event.ctrlKey &&
        event.shiftKey &&
        event.key.toLowerCase() === "a"
    ) {
        event.preventDefault();
        openM("adminLogin");
    }
});

function adminLogin(event) {
    event.preventDefault();

    if (
        au.value === ADMIN_USERNAME &&
        ap.value === ADMIN_PASSWORD
    ) {
        au.value = "";
        ap.value = "";

        closeM("adminLogin");

        renderAdmin();
        openM("admin");
    } else {
        msg("am", "Access denied.", true);
    }
}

function renderAdmin() {
    renderAdminOrders();
    renderPending();
    renderAdminProducts();
}

function renderAdminOrders() {
    const target = document.getElementById("adminOrders");

    if (!ORDERS.length) {
        target.innerHTML =
            '<div class="msg">No customer orders yet.</div>';
        return;
    }

    target.innerHTML = ORDERS
        .map(
            (orderItem) => `
                <div class="admin-order">
                    <div class="order-top">
                        <b>${esc(orderItem.id)}</b>
                        <span class="status">${esc(orderItem.status)}</span>
                    </div>

                    <p>
                        <b>Customer:</b>
                        ${esc(orderItem.customerName)}
                        <br>
                        <b>Email:</b>
                        ${esc(orderItem.customerEmail)}
                        <br>
                        <b>Phone:</b>
                        ${esc(orderItem.customerPhone)}
                        <br>
                        <b>Address:</b>
                        ${esc(orderItem.address)}
                        <br>
                        <b>Payment:</b>
                        ${esc(orderItem.payment)}
                    </p>

                    <div class="order-items">
                        ${
                            orderItem.items
                                .map(
                                    (item) => `
                                        <div>
                                            ${esc(item.productName)}
                                            —
                                            ${formatWeight(
                                                item.amount,
                                                item.unit
                                            )}
                                            —
                                            ₱${Number(
                                                item.lineTotal
                                            ).toFixed(2)}
                                        </div>
                                    `
                                )
                                .join("")
                        }
                    </div>

                    <p>
                        <b>Total:</b>
                        ₱${Number(orderItem.total).toLocaleString(
                            "en-PH",
                            {
                                minimumFractionDigits: 2
                            }
                        )}
                    </p>

                    <div class="admin-update">
                        <select id="status-${esc(orderItem.id)}">
                            ${[
                                "Order Received",
                                "Preparing",
                                "Packed",
                                "Shipped",
                                "Out for Delivery",
                                "Delivered",
                                "Cancelled"
                            ]
                                .map(
                                    (status) =>
                                        `<option ${
                                            status ===
                                            orderItem.status
                                                ? "selected"
                                                : ""
                                        }>${status}</option>`
                                )
                                .join("")}
                        </select>

                        <input
                            id="location-${esc(orderItem.id)}"
                            value="${esc(orderItem.location)}"
                            placeholder="Where is the order?"
                        >

                        <button
                            class="primary"
                            onclick="updateOrderStatus('${esc(
                                orderItem.id
                            )}')"
                        >
                            Update Order
                        </button>
                    </div>
                </div>
            `
        )
        .join("");
}

function updateOrderStatus(orderId) {
    const orderItem = ORDERS.find(
        (item) => item.id === orderId
    );

    if (!orderItem) {
        return;
    }

    const newStatus = document.getElementById(
        "status-" + orderId
    ).value;

    const newLocation = document.getElementById(
        "location-" + orderId
    ).value.trim();

    orderItem.status = newStatus;
    orderItem.location =
        newLocation || "Updated by bingchillin";

    orderItem.updates.push({
        status: newStatus,
        location: orderItem.location,
        time: new Date().toISOString()
    });

    saveData(STORAGE.orders, ORDERS);

    /*
        IMPORTANT:
        This is the exact place to connect your email provider/backend.
        The browser cannot safely send real automatic emails by itself.
    */
    sendOrderEmailUpdate(orderItem);

    renderAdminOrders();

    alert(
        "Order updated. The customer can now see the new status and location in My Orders."
    );
}

function sendOrderEmailUpdate(orderItem) {
    /*
        Placeholder for your real email service.

        Example server request:
        fetch("/api/order-update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderItem)
        });

        Your server should send the email to:
        orderItem.customerEmail

        Do NOT put a private email-service API key in this browser file.
    */

    console.log(
        "EMAIL UPDATE READY:",
        orderItem.customerEmail,
        orderItem.status,
        orderItem.location
    );
}

function renderPending() {
    pending.innerHTML = PENDING.length
        ? PENDING
              .map(
                  (user, index) => `
                      <div class="line">
                          <span>
                              <b>${esc(user.name)}</b>
                              <br>
                              ${esc(user.email)}
                          </span>

                          <span>
                              <button
                                  class="primary"
                                  onclick="approve(${index})"
                              >
                                  Approve
                              </button>

                              <button
                                  class="danger"
                                  onclick="reject(${index})"
                              >
                                  Reject
                              </button>
                          </span>
                      </div>
                  `
              )
              .join("")
        : '<div class="msg">No pending registrations.</div>';
}

function approve(index) {
    USERS.push(PENDING[index]);
    PENDING.splice(index, 1);

    saveData(STORAGE.users, USERS);
    saveData(STORAGE.pending, PENDING);

    renderPending();
}

function reject(index) {
    PENDING.splice(index, 1);

    saveData(STORAGE.pending, PENDING);

    renderPending();
}

function renderAdminProducts() {
    adminProducts.innerHTML = PRODUCTS
        .map(
            (product) => `
                <div class="line">
                    <span>
                        <b>${esc(product.name)}</b>
                        <br>
                        ₱${Number(product.pricePerKg).toFixed(2)} / kg
                        • Stock:
                        ${formatWeight(product.stockKg)}
                    </span>

                    <span>
                        <button onclick="edit(${product.id})">
                            Edit
                        </button>

                        <button
                            class="danger"
                            onclick="del(${product.id})"
                        >
                            Delete
                        </button>
                    </span>
                </div>
            `
        )
        .join("");
}

function saveProduct(event) {
    event.preventDefault();

    const product = {
        name: pn.value.trim(),
        pricePerKg: Number(pp.value),
        category: pc.value.trim(),
        image: pi.value.trim(),
        description: pd.value.trim(),
        stockKg: Number(ps.value)
    };

    if (eid.value) {
        Object.assign(
            PRODUCTS.find(
                (item) => item.id == eid.value
            ),
            product
        );
    } else {
        product.id = Date.now();
        PRODUCTS.push(product);
    }

    saveData(STORAGE.products, PRODUCTS);

    clearProduct();
    render();
    renderAdminProducts();
}

function edit(id) {
    const product = PRODUCTS.find(
        (item) => item.id === id
    );

    if (!product) {
        return;
    }

    eid.value = product.id;
    pn.value = product.name;
    pp.value = product.pricePerKg;
    pc.value = product.category;
    pi.value = product.image;
    pd.value = product.description;
    ps.value = product.stockKg;
}

function del(id) {
    if (!confirm("Delete this product?")) {
        return;
    }

    PRODUCTS = PRODUCTS.filter(
        (product) => product.id !== id
    );

    saveData(STORAGE.products, PRODUCTS);

    render();
    renderAdminProducts();
}

function clearProduct() {
    [
        eid,
        pn,
        pp,
        pc,
        pi,
        pd,
        ps
    ].forEach((field) => {
        field.value = "";
    });
}

function openM(id) {
    document
        .getElementById(id)
        .classList.add("show");
}

function closeM(id) {
    document
        .getElementById(id)
        .classList.remove("show");
}

function esc(value) {
    return String(value).replace(
        /[&<>"']/g,
        (character) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            })[character]
    );
}

window.addEventListener("beforeunload", saveCurrentCart);

authTab("login");
restoreSession();
