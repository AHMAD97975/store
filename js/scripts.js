// عدد البطاقات في كل شريحة في المعرض
const CARDS_PER_SLIDE = 3;

// دالة اختصار للحصول على العناصر بواسطة ID
const $ = (id) => document.getElementById(id);

// دالة للحصول على مسار الصور الصحيح (يختلف عن صفحة المتجر والإدارة)
function getImagePath(imageName) {
  // التحقق من أننا في مجلد pages/ أم في الجذر
  const isFromPages = window.location.pathname.includes("/pages/");
  // إرجاع المسار المناسب حسب الموقع الحالي
  return (isFromPages ? "../" : "./") + "assets/images/" + imageName;
}

// متغيرات عامة للتطبيق
let products = [], // قائمة جميع المنتجات المحملة
  filteredProducts = [], // قائمة المنتجات المفلترة حسب البحث والفئة
  currentSlide = 0, // رقم الشريحة الحالية في المعرض
  totalSlides = 0, // العدد الكلي للشرائح
  slideInterval, // معرّف الفاصل الزمني لتشغيل المعرض التلقائي
  editingProductId = null; // معرّف المنتج المراد تعديله (null إذا كان إضافة جديدة)

// دالة التهيئة الرئيسية التي تعمل عند تحميل الصفحة
function init() {
  // محاولة تحميل المنتجات المحفوظة من localStorage
  const stored = localStorage.getItem("products");
  if (stored) {
    try {
      // التحقق من سلامة البيانات المحفوظة
      const prods = JSON.parse(stored);
      // إذا كانت البيانات قديمة أو غير صالحة، تم مسحها
      if (prods.some((p) => !p.image || !p.image.includes("assets")))
        localStorage.removeItem("products");
    } catch (e) {
      // في حالة الخطأ في التحليل، تم مسح البيانات التالفة
      localStorage.removeItem("products");
    }
  }

  // تحميل المنتجات واسم المتجر
  loadProducts();
  loadStoreName();

  // تهيئة صفحة المتجر إذا كانت موجودة
  if ($("storePage")) initStore();

  // تهيئة صفحة الإدارة إذا كانت موجودة
  if ($("adminPage")) initAdmin();
}

// تهيئة صفحة المتجر (المتجر الرئيسي)
function initStore() {
  // تحديث قائمة الفئات المتاحة في المرشح
  updateCategoryFilter();
  // تطبيق الفلترة والبحث
  filterProducts();
  // بدء تشغيل المعرض التلقائي
  startSlider();
}

// تهيئة صفحة لوحة التحكم (الإدارة)
function initAdmin() {
  // عرض جدول المنتجات
  renderProductsTable();
  // إخفاء زر الإلغاء في البداية (يظهر فقط عند التعديل)
  const resetBtn = $("resetBtn");
  if (resetBtn) resetBtn.style.display = "none";
}

// تحميل قائمة المنتجات من localStorage أو من البيانات الافتراضية
function loadProducts() {
  const stored = localStorage.getItem("products");
  if (stored) {
    // تحميل المنتجات المحفوظة
    products = JSON.parse(stored);
    // تحديث مسارات الصور لجعلها نسبية حسب موقع الصفحة
    products = products.map((p) => ({
      ...p,
      image: getImagePath(p.image.split("/").pop()),
    }));
  } else {
    // إذا لم تكن هناك منتجات محفوظة، استخدام البيانات الافتراضية
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
    // حفظ البيانات الافتراضية في localStorage
    saveProducts();
  }
}

// حفظ قائمة المنتجات في localStorage
function saveProducts() {
  localStorage.setItem("products", JSON.stringify(products));
}

// تحميل اسم المتجر المحفوظ أو استخدام الاسم الافتراضي
function loadStoreName() {
  // الحصول على اسم المتجر من localStorage أو استخدام "OurStore" كقيمة افتراضية
  const stored = localStorage.getItem("storeName") || "OurStore";
  const el = $("storeName");
  // إذا كان هناك حقل إدخال لاسم المتجر، ملؤه بالاسم المحمل
  if (el) el.value = stored;
  // تحديث عرض اسم المتجر في الشعار والعنوان
  updateStoreNameDisplay(stored);
  // إذا لم يكن هناك اسم محفوظ، حفظ الافتراضي
  if (!localStorage.getItem("storeName"))
    localStorage.setItem("storeName", stored);
}

// تحديث اسم المتجر في localStorage وفي الصفحة
function updateStoreName() {
  const el = $("storeName"),
    name = el ? el.value.trim() : "";
  // التحقق من أن الاسم غير فارغ
  if (name) {
    // حفظ الاسم الجديد في localStorage
    localStorage.setItem("storeName", name);
    // تحديث عرض الاسم في الصفحة
    updateStoreNameDisplay(name);
  }
}

// تحديث عرض اسم المتجر في الشعار والعنوان
function updateStoreNameDisplay(storeName) {
  // تقسيم الاسم إلى كلمات
  const words = storeName.trim().split(" ");
  // الحصول على عناصر الشعار
  const logoOur = $("logoOur"),
    logoStore = $("logoStore");

  // معالجة الأسماء ذات كلمتين أو أكثر
  if (words.length >= 2) {
    if (logoOur) logoOur.textContent = words[0];
    if (logoStore) logoStore.textContent = words.slice(1).join(" ");
  }
  // معالجة الأسماء بكلمة واحدة (تقسيمها نصين)
  else if (words.length === 1) {
    const mid = Math.ceil(words[0].length / 2);
    if (logoOur) logoOur.textContent = words[0].substring(0, mid);
    if (logoStore) logoStore.textContent = words[0].substring(mid);
  }
  // إذا كان الاسم فارغاً، استخدام الشعار الافتراضي
  else {
    if (logoOur) logoOur.textContent = "Our";
    if (logoStore) logoStore.textContent = "Store";
  }
  // تحديث عنوان الصفحة في المتصفح
  document.title = storeName + " - متجر إلكتروني";
}

// تحديث قائمة الفئات المتاحة في مرشح البحث
function updateCategoryFilter() {
  // الحصول على جميع الفئات الفريدة من المنتجات
  const cats = [...new Set(products.map((p) => p.category))];
  const select = $("categoryFilter");
  if (!select) return;
  // إضافة خيار "جميع الفئات" ثم جميع الفئات المتوفرة
  select.innerHTML = '<option value="all">جميع الفئات</option>';
  cats.forEach((cat) => {
    select.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
}

// فلترة المنتجات حسب البحث والفئة والترتيب
function filterProducts() {
  // الحصول على قيم البحث والفئة والترتيب
  const search = ($("searchInput")?.value || "").toLowerCase();
  const category = $("categoryFilter")?.value || "all";
  const sort = $("sortOrder")?.value || "none";

  // فلترة المنتجات حسب البحث والفئة
  filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search) &&
      (category === "all" || p.category === category)
  );

  // ترتيب المنتجات حسب السعر (تصاعدي أو تنازلي)
  if (sort === "asc") filteredProducts.sort((a, b) => a.price - b.price);
  else if (sort === "desc") filteredProducts.sort((a, b) => b.price - a.price);

  // إعادة رسم المعرض بالمنتجات المفلترة
  renderSlider();
  // إعادة تعيين إلى الشريحة الأولى
  currentSlide = 0;
  // تحديث عرض الشريحة الحالية
  updateSlider();
}

// رسم بطاقات المنتجات في معرض الشرائح
function renderSlider() {
  const container = $("sliderContainer"),
    slider = $("slider"),
    dots = $("sliderDots");

  // إذا لم تكن هناك عناصر أو منتجات، إخفاء المعرض
  if (!container || !slider || !dots || filteredProducts.length === 0) {
    if (container) container.style.display = "none";
    totalSlides = 0;
    return;
  }

  // إظهار المعرض
  container.style.display = "block";
  const slides = [];

  // تقسيم المنتجات إلى شرائح (كل شريحة تحتوي على عدد معين من البطاقات)
  for (let i = 0; i < filteredProducts.length; i += CARDS_PER_SLIDE) {
    // الحصول على المنتجات لهذه الشريحة
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
    // إضافة الشريحة إلى قائمة الشرائح
    slides.push(
      `<div class="slide ${slides.length === 0 ? "active" : ""}">${cards}</div>`
    );
  }

  // إدراج الشرائح في DOM
  slider.innerHTML = slides.join("");
  // تحديث العدد الكلي للشرائح
  totalSlides = slides.length;

  // إضافة نقاط التنقل بين الشرائح
  dots.innerHTML = Array.from(
    { length: totalSlides },
    (_, i) =>
      `<div class="dot ${
        i === 0 ? "active" : ""
      }" onclick="goToSlide(${i})"></div>`
  ).join("");
}

// تحديث عرض الشريحة الحالية والنقاط المقابلة
function updateSlider() {
  // إذا لم تكن هناك شرائح، لا تفعل شيء
  if (!totalSlides) return;

  // تحديث فئة "active" على الشرائح لإظهار الحالية فقط
  document
    .querySelectorAll(".slide")
    .forEach((s, i) => s.classList.toggle("active", i === currentSlide));

  // تحديث فئة "active" على النقاط لإظهار النقطة المقابلة للشريحة الحالية
  document
    .querySelectorAll(".dot")
    .forEach((d, i) => d.classList.toggle("active", i === currentSlide));
}

// الانتقال إلى الشريحة التالية
function nextSlide() {
  if (totalSlides) {
    // زيادة رقم الشريحة الحالية وإعادة التعيين عند الوصول إلى النهاية
    currentSlide = (currentSlide + 1) % totalSlides;
    updateSlider();
  }
}

// الانتقال إلى الشريحة السابقة
function prevSlide() {
  if (totalSlides) {
    // تقليل رقم الشريحة الحالية مع التعامل مع الحالة السالبة
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateSlider();
  }
}

// الانتقال مباشرة إلى شريحة معينة
function goToSlide(i) {
  // التحقق من أن الرقم صحيح
  if (i >= 0 && i < totalSlides) {
    currentSlide = i;
    updateSlider();
  }
}

// اختيار منتج من المعرض وعرض إشعار
function selectProductFromSlider(id) {
  // البحث عن المنتج بواسطة المعرّف
  const p = products.find((x) => x.id === id);
  if (!p) return;

  // الحصول على عنصر البطاقة في DOM
  const card = document.querySelector(`[data-product-id="${id}"]`);
  if (card) {
    // إزالة فئة "selected" من جميع البطاقات
    document
      .querySelectorAll(".carousel-card")
      .forEach((c) => c.classList.remove("selected"));
    // إضافة فئة "selected" للبطاقة المختارة
    card.classList.add("selected");
    // تطبيق تأثير حركة الأرجحة على البطاقة
    card.style.transform = "scale(1.05)";
    // إزالة التأثير بعد بعض الوقت
    setTimeout(() => {
      card.style.transform = "";
    }, 300);
  }
  // عرض إشعار بأن المنتج قد تم اختياره
  showProductNotification(p);
}

// عرض إشعار بالمنتج المختار
function showProductNotification(p) {
  // إنشاء عنصر إشعار جديد
  const notif = document.createElement("div");
  notif.className = "product-notification";
  // ملء الإشعار ببيانات المنتج
  notif.innerHTML = `<div class="notification-content"><img src="${p.image}" alt="${p.name}" class="notification-image"><div class="notification-info"><h4>تم اختيار المنتج</h4><p>${p.name}</p><span class="notification-price">${p.price} $</span></div><button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button></div>`;
  // إضافة الإشعار إلى الصفحة
  document.body.appendChild(notif);

  // إظهار الإشعار بتأثير حركة (بعد فترة قصيرة لتفعيل الانتقال CSS)
  setTimeout(() => notif.classList.add("show"), 10);

  // إخفاء الإشعار بعد 3 ثوان
  setTimeout(() => {
    notif.classList.remove("show");
    // إزالة الإشعار من DOM بعد انتهاء تأثير الحركة
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// بدء تشغيل المعرض التلقائي (الانتقال بين الشرائح)
function startSlider() {
  // إيقاف أي معرض سابق يعمل
  stopSlider();
  // إذا كانت هناك أكثر من شريحة واحدة، ابدأ التشغيل التلقائي
  if (totalSlides > 1) slideInterval = setInterval(nextSlide, 4000);
}

// إيقاف تشغيل المعرض التلقائي
function stopSlider() {
  if (slideInterval) clearInterval(slideInterval);
}

// رسم جدول المنتجات في صفحة الإدارة
function renderProductsTable() {
  const tbody = $("productsTableBody");
  if (!tbody) return;

  // إذا كانت هناك منتجات، إنشاء صفوف للجدول
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
    : // إذا لم تكن هناك منتجات، عرض رسالة فارغة
      '<tr><td colspan="5" class="empty-state">لا توجد منتجات. قم بإضافة منتج جديد.</td></tr>';
}

// حفظ منتج جديد أو تحديث منتج موجود
async function saveProduct() {
  // الحصول على بيانات المنتج من الحقول
  const name = $("productName")?.value?.trim() || "";
  const price = Number.parseFloat($("productPrice")?.value || 0);
  const category = $("productCategory")?.value?.trim() || "";
  const image = $("productImage")?.value?.trim() || "";
  const fileInput = $("productImageFile");

  // التحقق من أن جميع الحقول المطلوبة مملوءة
  if (!name || !price || !category || (!image && !fileInput?.files?.length)) {
    alert("الرجاء ملء جميع الحقول أو رفع صورة");
    return;
  }

  let imageSrc = image;
  // إذا كان المستخدم قد رفع صورة من الجهاز، قراءتها كـ Data URL
  if (fileInput?.files?.[0]) {
    try {
      imageSrc = await readFileAsDataURL(fileInput.files[0]);
    } catch (e) {
      console.error("خطأ في الصورة");
    }
  }

  // إذا كان المستخدم يعدل منتجاً موجوداً
  if (editingProductId) {
    // البحث عن المنتج في المصفوفة وتحديثه
    const idx = products.findIndex((p) => p.id === editingProductId);
    products[idx] = {
      id: editingProductId,
      name,
      price,
      category,
      image: imageSrc,
    };
  }
  // إذا كان المستخدم يضيف منتجاً جديداً
  else {
    // إضافة المنتج الجديد مع معرّف فريد بناءً على الوقت الحالي
    products.push({ id: Date.now(), name, price, category, image: imageSrc });
  }

  // حفظ البيانات المحدثة
  saveProducts();
  // تحديث قائمة الفئات
  updateCategoryFilter();
  // إعادة فلترة المنتجات وعرضها
  filterProducts();
  // تحديث جدول المنتجات
  renderProductsTable();
  // مسح النموذج
  resetForm();
}

// تحميل بيانات منتج موجود في نموذج التعديل
function editProduct(id) {
  // البحث عن المنتج بواسطة المعرّف
  const p = products.find((x) => x.id === id);
  if (!p) return;

  // تعيين المعرّف الحالي للمنتج المراد تعديله
  editingProductId = id;

  // ملء نموذج التعديل ببيانات المنتج
  if ($("productName")) $("productName").value = p.name;
  if ($("productPrice")) $("productPrice").value = p.price;
  if ($("productCategory")) $("productCategory").value = p.category;
  if ($("productImage")) $("productImage").value = p.image;

  // تغيير عنوان النموذج إلى "تعديل المنتج"
  if ($("formTitle")) $("formTitle").textContent = "تعديل المنتج";

  // إظهار زر الإلغاء
  const btn = $("resetBtn");
  if (btn) btn.style.display = "block";

  // التمرير السلس إلى النموذج
  if ($("productForm")) $("productForm").scrollIntoView({ behavior: "smooth" });
}

// حذف منتج من المتجر
function deleteProduct(id) {
  // طلب تأكيد من المستخدم قبل الحذف
  if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
    // إزالة المنتج من المصفوفة
    products = products.filter((p) => p.id !== id);
    // حفظ البيانات المحدثة
    saveProducts();
    // تحديث قائمة الفئات
    updateCategoryFilter();
    // إعادة فلترة المنتجات
    filterProducts();
    // تحديث جدول المنتجات
    renderProductsTable();
  }
}

// استعادة الإعدادات الافتراضية (مسح جميع البيانات المحفوظة)
function restoreDefaults() {
  // طلب تأكيد من المستخدم لأن هذه العملية ستمسح جميع البيانات
  if (
    confirm(
      "هل أنت متأكد من استعادة الإعدادات الافتراضية؟ سيتم مسح جميع البيانات."
    )
  ) {
    // مسح جميع البيانات المحفوظة في localStorage
    localStorage.clear();
    // إعادة تحميل الصفحة
    location.reload();
  }
}

// قراءة ملف من الجهاز وتحويله إلى Data URL (للصور)
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    // إنشاء FileReader جديد
    const reader = new FileReader();
    // معالج عند نجاح القراءة
    reader.onload = () => resolve(reader.result);
    // معالج عند الخطأ
    reader.onerror = () => reject();
    // قراءة الملف كـ Data URL
    reader.readAsDataURL(file);
  });
}

// مسح نموذج إضافة/تعديل المنتج
function resetForm() {
  // إعادة تعيين معرّف المنتج المراد تعديله
  editingProductId = null;

  // مسح جميع حقول النموذج
  if ($("productName")) $("productName").value = "";
  if ($("productPrice")) $("productPrice").value = "";
  if ($("productCategory")) $("productCategory").value = "";
  if ($("productImage")) $("productImage").value = "";

  // تغيير عنوان النموذج إلى الافتراضي (إضافة جديدة)
  if ($("formTitle")) $("formTitle").textContent = "إضافة / تعديل المنتج";

  // إخفاء زر الإلغاء
  const btn = $("resetBtn");
  if (btn) btn.style.display = "none";

  // مسح حقل الملف (الصورة)
  if ($("productImageFile")) $("productImageFile").value = "";
}

// استدعاء دالة التهيئة عند تحميل الصفحة
window.onload = init;
