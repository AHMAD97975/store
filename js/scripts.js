const CARDS_PER_SLIDE = 3;

const $ = (id) => document.getElementById(id);

function getImagePath(imageName) {
  const isFromPages = window.location.pathname.includes("/pages/");
  return (isFromPages ? "../" : "./") + "assets/images/" + imageName;
}

let products = [],
  filteredProducts = [],
  currentSlide = 0,
  totalSlides = 0,
  slideInterval,
  editingProductId = null;

function init() {
  const stored = localStorage.getItem("products");
  if (stored) {
    try {
      const prods = JSON.parse(stored);
      if (prods.some((p) => !p.image || !p.image.includes("assets")))
        localStorage.removeItem("products");
    } catch (e) {
      localStorage.removeItem("products");
    }
  }

  loadProducts();
  loadStoreName();

  if ($("storePage")) initStore();
  if ($("adminPage")) initAdmin();
}

function initStore() {
  updateCategoryFilter();
  filterProducts();
  startSlider();
}

function initAdmin() {
  renderProductsTable();
  const resetBtn = $("resetBtn");
  if (resetBtn) resetBtn.style.display = "none";
}

function loadProducts() {
  const stored = localStorage.getItem("products");
  if (stored) {
    products = JSON.parse(stored);
    products = products.map((p) => ({
      ...p,
      image: getImagePath(p.image.split("/").pop()),
    }));
  } else {
    products = [
      {
        id: 1,
        name: "هاتف سامسونج جالاكسي",
        price: 899,
        category: "موبايلات",
        image: getImagePath("phone-galaxy.jpg"),
      },
      {
        id: 2,
        name: "هاتف آيفون 15",
        price: 1199,
        category: "موبايلات",
        image: getImagePath("phone-iphone.jpg"),
      },
      {
        id: 3,
        name: "حاسوب محمول HP",
        price: 1299,
        category: "حواسيب",
        image: getImagePath("laptop-hp.jpg"),
      },
      {
        id: 4,
        name: "حاسوب ماك بوك برو",
        price: 1999,
        category: "حواسيب",
        image: getImagePath("laptop-macbook.jpg"),
      },
      {
        id: 5,
        name: "ساعة آبل الذكية",
        price: 399,
        category: "الكترونيات",
        image: getImagePath("watch-apple.jpg"),
      },
      {
        id: 6,
        name: "سماعات بلوتوث سوني",
        price: 149,
        category: "اكسسوارات",
        image: getImagePath("headphones-sony.jpg"),
      },
      {
        id: 7,
        name: "كاميرا كانون احترافية",
        price: 899,
        category: "الكترونيات",
        image: getImagePath("camera-canon.jpg"),
      },
      {
        id: 8,
        name: "كتاب تعلم البرمجة",
        price: 39.99,
        category: "كتب",
        image: getImagePath("book-programming.jpg"),
      },
      {
        id: 9,
        name: "معطف شتوي عصري",
        price: 129.5,
        category: "ملابس",
        image: getImagePath("coat-winter.jpg"),
      },
      {
        id: 10,
        name: "حذاء رياضي نايك",
        price: 89.99,
        category: "أحذية",
        image: getImagePath("shoes-nike.jpg"),
      },
    ];
    saveProducts();
  }
}

function saveProducts() {
  localStorage.setItem("products", JSON.stringify(products));
}

function loadStoreName() {
  const stored = localStorage.getItem("storeName") || "OurStore";
  const el = $("storeName");
  if (el) el.value = stored;
  updateStoreNameDisplay(stored);
  if (!localStorage.getItem("storeName"))
    localStorage.setItem("storeName", stored);
}

function updateStoreName() {
  const el = $("storeName"),
    name = el ? el.value.trim() : "";
  if (name) {
    localStorage.setItem("storeName", name);
    updateStoreNameDisplay(name);
  }
}

function updateStoreNameDisplay(storeName) {
  const words = storeName.trim().split(" ");
  const logoOur = $("logoOur"),
    logoStore = $("logoStore");

  if (words.length >= 2) {
    if (logoOur) logoOur.textContent = words[0];
    if (logoStore) logoStore.textContent = words.slice(1).join(" ");
  } else if (words.length === 1) {
    const mid = Math.ceil(words[0].length / 2);
    if (logoOur) logoOur.textContent = words[0].substring(0, mid);
    if (logoStore) logoStore.textContent = words[0].substring(mid);
  } else {
    if (logoOur) logoOur.textContent = "Our";
    if (logoStore) logoStore.textContent = "Store";
  }
  document.title = storeName + " - متجر إلكتروني";
}

function updateCategoryFilter() {
  const cats = [...new Set(products.map((p) => p.category))];
  const select = $("categoryFilter");
  if (!select) return;
  select.innerHTML = '<option value="all">جميع الفئات</option>';
  cats.forEach((cat) => {
    select.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
}

function filterProducts() {
  const search = ($("searchInput")?.value || "").toLowerCase();
  const category = $("categoryFilter")?.value || "all";
  const sort = $("sortOrder")?.value || "none";

  filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search) &&
      (category === "all" || p.category === category)
  );

  if (sort === "asc") filteredProducts.sort((a, b) => a.price - b.price);
  else if (sort === "desc") filteredProducts.sort((a, b) => b.price - a.price);

  renderSlider();
  currentSlide = 0;
  updateSlider();
}

function renderSlider() {
  const container = $("sliderContainer"),
    slider = $("slider"),
    dots = $("sliderDots");

  if (!container || !slider || !dots || filteredProducts.length === 0) {
    if (container) container.style.display = "none";
    totalSlides = 0;
    return;
  }

  container.style.display = "block";
  const slides = [];

  for (let i = 0; i < filteredProducts.length; i += CARDS_PER_SLIDE) {
    const cards = filteredProducts
      .slice(i, i + CARDS_PER_SLIDE)
      .map(
        (p) => `
      <div class="slider-card carousel-card" onclick="selectProductFromSlider(${p.id})" data-product-id="${p.id}">
        <img src="${p.image}" alt="${p.name}" class="card-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iIzMzNyIvPjx0ZXh0IHg9IjEwMCIgeT0iODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuKAquKAquKApjwvdGV4dD48L3N2Zz4='">
        <h4>${p.name}</h4>
        <div class="card-price">${p.price} $</div>
        <span class="card-category">${p.category}</span>
        <div class="card-overlay"><div class="select-hint">اضغط للاختيار</div></div>
      </div>
    `
      )
      .join("");
    slides.push(
      `<div class="slide ${slides.length === 0 ? "active" : ""}">${cards}</div>`
    );
  }

  slider.innerHTML = slides.join("");
  totalSlides = slides.length;

  dots.innerHTML = Array.from(
    { length: totalSlides },
    (_, i) =>
      `<div class="dot ${
        i === 0 ? "active" : ""
      }" onclick="goToSlide(${i})"></div>`
  ).join("");
}

function updateSlider() {
  if (!totalSlides) return;

  document
    .querySelectorAll(".slide")
    .forEach((s, i) => s.classList.toggle("active", i === currentSlide));

  document
    .querySelectorAll(".dot")
    .forEach((d, i) => d.classList.toggle("active", i === currentSlide));
}

function nextSlide() {
  if (totalSlides) {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateSlider();
  }
}

function prevSlide() {
  if (totalSlides) {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateSlider();
  }
}

function goToSlide(i) {
  if (i >= 0 && i < totalSlides) {
    currentSlide = i;
    updateSlider();
  }
}

function selectProductFromSlider(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;

  const card = document.querySelector(`[data-product-id="${id}"]`);
  if (card) {
    document
      .querySelectorAll(".carousel-card")
      .forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    card.style.transform = "scale(1.05)";
    setTimeout(() => {
      card.style.transform = "";
    }, 300);
  }
  showProductNotification(p);
}

function showProductNotification(p) {
  const notif = document.createElement("div");
  notif.className = "product-notification";
  notif.innerHTML = `<div class="notification-content"><img src="${p.image}" alt="${p.name}" class="notification-image"><div class="notification-info"><h4>تم اختيار المنتج</h4><p>${p.name}</p><span class="notification-price">${p.price} $</span></div><button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button></div>`;
  document.body.appendChild(notif);

  setTimeout(() => notif.classList.add("show"), 10);

  setTimeout(() => {
    notif.classList.remove("show");
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

function startSlider() {
  stopSlider();
}

function stopSlider() {
  if (slideInterval) clearInterval(slideInterval);
}

function renderProductsTable() {
  const tbody = $("productsTableBody");
  if (!tbody) return;

  tbody.innerHTML = products.length
    ? products
        .map(
          (p) => `
    <tr>
      <td>${p.name}</td>
      <td>${p.price} $</td>
      <td>${p.category}</td>
      <td><img src="${p.image}" class="product-img-small" alt="${p.name}"></td>
      <td><div class="actions-cell">
        <button class="btn btn-warning" onclick="editProduct(${p.id})">✏️ تعديل</button>
        <button class="btn btn-danger" onclick="deleteProduct(${p.id})">🗑️ حذف</button>
      </div></td>
    </tr>
  `
        )
        .join("")
    : '<tr><td colspan="5" class="empty-state">لا توجد منتجات. قم بإضافة منتج جديد.</td></tr>';
}

async function saveProduct() {
  const name = $("productName")?.value?.trim() || "";
  const price = Number.parseFloat($("productPrice")?.value || 0);
  const category = $("productCategory")?.value?.trim() || "";
  const image = $("productImage")?.value?.trim() || "";
  const fileInput = $("productImageFile");

  if (!name || !price || !category || (!image && !fileInput?.files?.length)) {
    alert("الرجاء ملء جميع الحقول أو رفع صورة");
    return;
  }

  let imageSrc = image;
  if (fileInput?.files?.[0]) {
    try {
      imageSrc = await readFileAsDataURL(fileInput.files[0]);
    } catch (e) {
      console.error("خطأ في الصورة");
    }
  }

  if (editingProductId) {
    const idx = products.findIndex((p) => p.id === editingProductId);
    products[idx] = {
      id: editingProductId,
      name,
      price,
      category,
      image: imageSrc,
    };
  } else {
    products.push({ id: Date.now(), name, price, category, image: imageSrc });
  }

  saveProducts();
  updateCategoryFilter();
  filterProducts();
  renderProductsTable();
  resetForm();
}

function editProduct(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;

  editingProductId = id;

  if ($("productName")) $("productName").value = p.name;
  if ($("productPrice")) $("productPrice").value = p.price;
  if ($("productCategory")) $("productCategory").value = p.category;
  if ($("productImage")) $("productImage").value = p.image;

  if ($("formTitle")) $("formTitle").textContent = "تعديل المنتج";

  const btn = $("resetBtn");
  if (btn) btn.style.display = "block";

  if ($("productForm")) $("productForm").scrollIntoView({ behavior: "smooth" });
}

function deleteProduct(id) {
  if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
    products = products.filter((p) => p.id !== id);
    saveProducts();
    updateCategoryFilter();
    filterProducts();
    renderProductsTable();
  }
}

function restoreDefaults() {
  if (
    confirm(
      "هل أنت متأكد من استعادة الإعدادات الافتراضية؟ سيتم مسح جميع البيانات."
    )
  ) {
    localStorage.clear();
    location.reload();
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject();
    reader.readAsDataURL(file);
  });
}

function resetForm() {
  editingProductId = null;

  if ($("productName")) $("productName").value = "";
  if ($("productPrice")) $("productPrice").value = "";
  if ($("productCategory")) $("productCategory").value = "";
  if ($("productImage")) $("productImage").value = "";

  if ($("formTitle")) $("formTitle").textContent = "إضافة / تعديل المنتج";

  const btn = $("resetBtn");
  if (btn) btn.style.display = "none";

  if ($("productImageFile")) $("productImageFile").value = "";
}

window.onload = init;
