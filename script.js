// Elements
const wrapper = document.querySelector(".wrapper");
const search = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");
const sortFilter = document.getElementById("sortFilter");
const loading = document.getElementById("loading");

// Modal elements
const modal = document.getElementById("productModal");
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalDesc = document.getElementById("modalDesc");
const modalPrice = document.getElementById("modalPrice");
const closeModal = document.getElementById("closeModal");

let productsData = [];

// Fetch products
async function loadProducts() {
  loading.style.display = "block";

  const res = await fetch("https://fakestoreapi.com/products");
  productsData = await res.json();

  loading.style.display = "none";

  loadCategories();
  displayProducts(productsData);
}

// Load unique categories into dropdown
function loadCategories() {
  let cats = [...new Set(productsData.map(p => p.category))];

  cats.forEach(c => {
    let opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c.toUpperCase();
    categoryFilter.appendChild(opt);
  });
}

// Display products
function displayProducts(list) {
  wrapper.innerHTML = "";

  list.forEach(product => {
    let card = document.createElement("div");
    card.className = "products";

    card.innerHTML = `
      <img src="${product.image}">
      <h2>${product.title}</h2>
      <h3>₹${product.price}</h3>
    `;

    card.onclick = () => openProduct(product);

    wrapper.appendChild(card);
  });
}

// Open Modal
function openProduct(product) {
  modal.style.display = "flex";
  modalImage.src = product.image;
  modalTitle.textContent = product.title;
  modalDesc.textContent = product.description;
  modalPrice.textContent = "Price: ₹" + product.price;
}

closeModal.onclick = () => modal.style.display = "none";

window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

// Filters + Search + Sorting
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

  if (sort === "low") filtered.sort((a,b) => a.price - b.price);
  if (sort === "high") filtered.sort((a,b) => b.price - a.price);

  displayProducts(filtered);
}

search.oninput = applyFilters;
categoryFilter.onchange = applyFilters;
sortFilter.onchange = applyFilters;

// load app
loadProducts();


const themeToggle = document.getElementById("themeToggle");

// Apply saved theme
if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
  themeToggle.textContent = "☀️";
}

// Toggle theme
themeToggle.onclick = () => {
  document.documentElement.classList.toggle("dark");

  // Save preference
  if (document.documentElement.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
    themeToggle.textContent = "☀️";
  } else {
    localStorage.setItem("theme", "light");
    themeToggle.textContent = "🌙";
  }
};
