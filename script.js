// Elements
const wrapper = document.querySelector(".wrapper");
const search = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");
const sortFilter = document.getElementById("sortFilter");
const loading = document.getElementById("loading");

const modal = document.getElementById("productModal");
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalDesc = document.getElementById("modalDesc");
const modalPrice = document.getElementById("modalPrice");
const closeModal = document.getElementById("closeModal");

const variantSize = document.getElementById("variantSize");
const variantColor = document.getElementById("variantColor");
const qtySelector = document.getElementById("qtySelector");
const addToCartBtn = document.getElementById("addToCartBtn");
const favModalBtn = document.getElementById("favModalBtn");

const showFavoritesBtn = document.getElementById("showFavorites");
const showAllBtn = document.getElementById("showAll");
const showCartBtn = document.getElementById("showCart");
const cartCountBadge = document.getElementById("cartCount");
const themeToggle = document.getElementById("themeToggle");

let productsData = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];  // favorite product IDs
let cart = JSON.parse(localStorage.getItem("cart")) || []; // cart items: {id,size,color,qty}
let currentModalProduct = null;

// utility to update cart count badge
function updateCartBadge() {
  const totalQty = cart.reduce((s,i)=> s + Number(i.qty), 0);
  cartCountBadge.textContent = totalQty;
}
updateCartBadge();

// Fetch products
async function loadProducts() {
  loading.style.display = "block";
  try {
    const res = await fetch("https://fakestoreapi.com/products");
    productsData = await res.json();
  } catch (e) {
    console.error("Failed to fetch products", e);
    productsData = [];
  }
  loading.style.display = "none";
  loadCategories();
  displayProducts(productsData);
}

// Load categories
function loadCategories() {
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  let cats = [...new Set(productsData.map(p => p.category))];

  cats.forEach(c => {
    let opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c.toUpperCase();
    categoryFilter.appendChild(opt);
  });
}

// Display products (cards)
function displayProducts(list) {
  wrapper.innerHTML = "";

  if (!list || list.length === 0) {
    wrapper.innerHTML = `<h2 style="padding:30px">No products to show.</h2>`;
    return;
  }

  list.forEach(product => {
    const isFav = favorites.includes(product.id);

    let card = document.createElement("div");
    card.className = "products";

    card.innerHTML = `
      <div class="img-box">
        <img src="${product.image}" alt="${escapeHtml(product.title)}">
      </div>

      <button class="fav-btn" data-id="${product.id}" title="Toggle favorite">
        ${isFav ? "❤️" : "🤍"}
      </button>

      <button class="add-cart-card-btn" data-id="${product.id}" title="Quick add to cart">🛒</button>

      <h2>${truncate(product.title, 60)}</h2>
      <h3>$${product.price}</h3>
    `;

    // card click opens modal (but not when clicking buttons)
    card.querySelector(".img-box").onclick = () => openProduct(product);
    card.querySelector("h2").onclick = () => openProduct(product);

    // favorite toggle (card)
    card.querySelector(".fav-btn").onclick = (e) => {
      e.stopPropagation();
      toggleFavorite(product.id);
      displayProducts(list); // refresh
    };

    // quick add button: adds default size/color/qty=1
    card.querySelector(".add-cart-card-btn").onclick = (e) => {
      e.stopPropagation();
      addToCart(product.id, "M", "Default", 1); // defaults
      updateCartBadge();
      // show simple feedback (flash)
      flashButton(e.currentTarget, "Added");
    };

    wrapper.appendChild(card);
  });
}

// Utility helpers
function truncate(str, n) {
  return (str.length > n) ? str.slice(0, n-1) + "…" : str;
}
function escapeHtml(s){ return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }
function flashButton(btn, text){
  const orig = btn.textContent;
  btn.textContent = text;
  setTimeout(()=> btn.textContent = orig, 900);
}

// Toggle favorite (global)
function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(x => x !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

// Add to cart (with variant and qty)
function addToCart(id, size, color, qty) {
  qty = Number(qty);
  if (!id || qty <= 0) return;

  // check if same variant exists — then increase qty
  const found = cart.find(item => item.id === id && item.size === size && item.color === color);
  if (found) {
    found.qty = Number(found.qty) + qty;
  } else {
    cart.push({ id, size, color, qty });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
}

// Remove from cart
function removeFromCart(index) {
  cart.splice(index,1);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
}

// Update cart item qty
function updateCartQty(index, qty) {
  qty = Number(qty);
  if (qty <= 0) {
    removeFromCart(index);
  } else {
    cart[index].qty = qty;
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
}

// Display cart page (list items)
function displayCart() {
  wrapper.innerHTML = "";
  if (cart.length === 0) {
    wrapper.innerHTML = `<h2 style="padding:30px">Your cart is empty 🛒</h2>`;
    return;
  }

  cart.forEach((citem, idx) => {
    const prod = productsData.find(p => p.id === citem.id);
    if (!prod) return;

    const itemDiv = document.createElement("div");
    itemDiv.className = "products";
    itemDiv.innerHTML = `
      <div class="img-box"><img src="${prod.image}" alt=""></div>
      <h2>${truncate(prod.title,60)}</h2>
      <p>Size: <strong>${citem.size}</strong> • Color: <strong>${citem.color}</strong></p>
      <p>Price: $${prod.price}</p>
      <div style="display:flex; gap:8px; justify-content:center; align-items:center; margin-top:8px;">
        <button class="dec" data-idx="${idx}">−</button>
        <input class="cart-qty" data-idx="${idx}" type="number" min="1" value="${citem.qty}" style="width:60px; text-align:center; padding:6px; border-radius:6px; border:1px solid #ccc;">
        <button class="inc" data-idx="${idx}">+</button>
      </div>
      <div style="margin-top:10px;">
        <button class="remove" data-idx="${idx}" style="background:#ff6b6b; color:#fff; border:none; padding:8px 10px; border-radius:6px; cursor:pointer;">Remove</button>
      </div>
    `;
    wrapper.appendChild(itemDiv);
  });

  // attach handlers for qty controls and remove
  wrapper.querySelectorAll(".dec").forEach(btn=>{
    btn.onclick = (e)=>{
      const i = Number(e.currentTarget.dataset.idx);
      const newQty = (Number(cart[i].qty) - 1);
      updateCartQty(i, newQty);
      displayCart();
    };
  });
  wrapper.querySelectorAll(".inc").forEach(btn=>{
    btn.onclick = (e)=>{
      const i = Number(e.currentTarget.dataset.idx);
      const newQty = (Number(cart[i].qty) + 1);
      updateCartQty(i, newQty);
      displayCart();
    };
  });
  wrapper.querySelectorAll(".cart-qty").forEach(inp=>{
    inp.onchange = (e)=>{
      const i = Number(e.currentTarget.dataset.idx);
      const val = Number(e.currentTarget.value) || 1;
      updateCartQty(i, val);
      displayCart();
    };
  });
  wrapper.querySelectorAll(".remove").forEach(btn=>{
    btn.onclick = (e)=>{
      const i = Number(e.currentTarget.dataset.idx);
      removeFromCart(i);
      displayCart();
    };
  });

  // show totals at bottom
  const totals = cart.reduce((acc, it)=> {
    const pd = productsData.find(p=>p.id===it.id);
    const price = pd ? Number(pd.price) : 0;
    acc.sub += price * it.qty;
    return acc;
  }, { sub:0 });

  const totalDiv = document.createElement("div");
  totalDiv.style.padding = "20px";
  totalDiv.style.textAlign = "center";
  totalDiv.innerHTML = `<h3>Subtotal: $${totals.sub.toFixed(2)}</h3>`;
  wrapper.appendChild(totalDiv);
}

// Open Modal & populate variants
function openProduct(product) {
  currentModalProduct = product;
  modal.style.display = "flex";
  modalImage.src = product.image;
  modalTitle.textContent = product.title;
  modalDesc.textContent = product.description;
  modalPrice.textContent = "Price: $" + product.price;

  // populate variant dropdowns (example sizes + colors)
  const sizes = ["S","M","L","XL"];
  const colors = ["Default","Red","Blue","Green","Black"];

  variantSize.innerHTML = "";
  sizes.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s; opt.textContent = s;
    variantSize.appendChild(opt);
  });

  variantColor.innerHTML = "";
  colors.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = c;
    variantColor.appendChild(opt);
  });

  qtySelector.value = 1;

  // modal favorite button state
  favModalBtn.textContent = favorites.includes(product.id) ? "❤️" : "🤍";
}

// modal close handlers
closeModal.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

// Add to cart from modal
addToCartBtn.onclick = () => {
  if (!currentModalProduct) return;
  const size = variantSize.value;
  const color = variantColor.value;
  const qty = Number(qtySelector.value) || 1;
  addToCart(currentModalProduct.id, size, color, qty);
  updateCartBadge();
  // optionally feedback
  addToCartBtn.textContent = "Added!";
  setTimeout(()=> addToCartBtn.textContent = "Add to Cart", 900);
};

// favorite toggle from modal
favModalBtn.onclick = () => {
  if (!currentModalProduct) return;
  toggleFavorite(currentModalProduct.id);
  favModalBtn.textContent = favorites.includes(currentModalProduct.id) ? "❤️" : "🤍";
};

// Filters + Search + Sort
function applyFilters() {
  let text = search.value.toLowerCase();
  let cat = categoryFilter.value;
  let sort = sortFilter.value;

  let filtered = productsData.filter(p =>
    p.title.toLowerCase().includes(text)
  );

  if (cat !== "all") {
    filtered = filtered.filter(p => p.category === cat);
  }

  if (sort === "low") filtered.sort((a, b) => a.price - b.price);
  if (sort === "high") filtered.sort((a, b) => b.price - a.price);

  displayProducts(filtered);
}

// show favorites page
showFavoritesBtn.onclick = () => {
  const favProducts = productsData.filter(p => favorites.includes(p.id));
  displayProducts(favProducts);
  // toggle buttons
  showFavoritesBtn.style.display = "none";
  showCartBtn.style.display = "none";
  showAllBtn.style.display = "inline-block";
};

// show cart page
showCartBtn.onclick = () => {
  displayCart();
  showFavoritesBtn.style.display = "none";
  showCartBtn.style.display = "none";
  showAllBtn.style.display = "inline-block";
};

// show all products
showAllBtn.onclick = () => {
  displayProducts(productsData);
  showAllBtn.style.display = "none";
  showFavoritesBtn.style.display = "inline-block";
  showCartBtn.style.display = "inline-block";
};

// theme toggle (persist)
if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
  themeToggle.textContent = "☀️";
}
themeToggle.onclick = () => {
  document.documentElement.classList.toggle("dark");
  if (document.documentElement.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
    themeToggle.textContent = "☀️";
  } else {
    localStorage.setItem("theme", "light");
    themeToggle.textContent = "🌙";
  }
};

// quick helpers bind filters
search.oninput = applyFilters;
categoryFilter.onchange = applyFilters;
sortFilter.onchange = applyFilters;

// initial load
loadProducts();
updateCartBadge();
