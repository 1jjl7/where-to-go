// Interface text in Arabic and English. Load this file first.
// Usage: t("placesTitle", { city: "جدة" }) -> "الأعلى تقييماً في جدة"

const LANG = (() => {
  try { return localStorage.getItem("lang") === "en" ? "en" : "ar"; } catch { return "ar"; }
})();

const STRINGS = {
  ar: {
    siteName: "وين أروح",
    docTitle: "وين أروح في {city} | دليل الكوفيهات والمطاعم والترفيه",
    langButton: "English",
    citySwitch: "اختر المدينة",
    searchLabel: "ابحث عن مكان",
    searchPlaceholder: "ابحث باسم المكان أو الحي أو الميزة…",
    heroTitle: "وين تروح في {city}؟",
    placesTitle: "الأعلى تقييماً في {city}",
    placesSub: "مرتبة حسب التقييم الموزون: التقييم وعدد المقيّمين معاً",
    tabsLabel: "التصنيف",
    all: "الكل", cafes: "كوفيهات", restaurants: "مطاعم", fun: "ترفيه",
    familyOnly: "مناسب للعوائل فقط",
    count: "{n} مكان",
    empty: "ما لقينا مكان يطابق بحثك. جرّب كلمة ثانية أو تصنيف ثاني.",
    planTitle: "يومك في {city}",
    planLabel: "نوع الخطة",
    best: "الأفضل", family: "عائلي", budget: "اقتصادي",
    morning: "الصباح", breakfast: "فطور وقهوة",
    forenoon: "الضحى", tour: "جولة",
    noon: "الظهر", lunch: "غداء",
    afternoon: "العصر", coffee: "قهوة العصر",
    night: "الليل", dinner: "عشاء",
    planNone: "ما فيه مكان مناسب بعد",
    footerSource: "التقييمات وأعداد المقيّمين منقولة من خرائط Google، وآخر تحقق منها: {date}.",
    footerAuthor: "وين أروح · مشروع شخصي من Ahmed Algaoni",
    reviewsCount: "({n} تقييم)",
    details: "التفاصيل والتقييم",
    map: "الخريطة",
    openMap: "افتح {name} في خرائط Google",
    familyTag: "مناسب للعوائل",
    dataError: "تعذّر تحميل البيانات. شغّل الموقع من خادم محلي (python -m http.server).",
    // place page
    placeDocTitle: "{name} | وين أروح في {city}",
    back: "رجوع إلى {city}",
    googleLabel: "تقييم خرائط Google",
    visitorsLabel: "تقييم زوار وين أروح",
    fromReviews: "من {n} تقييم",
    fromVisitors: "من {n} زائر",
    beFirst: "كن أول من يقيّم",
    hood: "الحي", price: "السعر", familyFriendly: "مناسب للعوائل", hours: "أوقات العمل",
    yes: "نعم", no: "لا",
    hoursUnknown: "غير مذكورة، تأكد من الخريطة",
    openInMaps: "افتح في خرائط Google",
    sourceNote: "مصدر التقييم: خرائط Google · آخر تحقق: {date}",
    formTitle: "زرت المكان؟ قيّمه",
    yourRating: "تقييمك",
    starHint: "اضغط على النجوم: من ١ إلى ٥",
    starLabel: "{n} من ٥ · {word}",
    starWords: ["", "سيئ", "مقبول", "جيد", "جيد جداً", "ممتاز"],
    starAria: "{n} من ٥",
    nameLabel: "اسمك (اختياري)",
    namePlaceholder: "مثلاً: زائر من الرياض",
    commentLabel: "تعليقك",
    commentPlaceholder: "وش عجبك؟ وش ما عجبك؟",
    submit: "أرسل التقييم",
    localNote: "ملاحظة: التقييمات حالياً تنحفظ في جهازك فقط (نسخة تجريبية)، وبنربطها بقاعدة بيانات لاحقاً.",
    errNoStars: "اختر عدد النجوم أول.",
    errShort: "اكتب تعليق قصير على الأقل.",
    errSave: "ما قدرنا نحفظ التقييم في هذا المتصفح.",
    errDigits: "الاسم ما يقبل أرقام.",
    thanks: "شكراً لك! انضاف تقييمك.",
    reviewsTitle: "آراء الزوار",
    noReviews: "ما فيه آراء للحين. شاركنا تجربتك!",
    visitor: "زائر",
    similarTitle: "{cats} ثانية في {city}",
    plural: { cafe: "كوفيهات", restaurant: "مطاعم", entertainment: "أماكن ترفيه" },
    notFound: "ما لقينا هذا المكان",
    notFoundText: "الرابط غير صحيح أو المكان انحذف. ",
    goHome: "ارجع للصفحة الرئيسية",
    loadError: "تعذّر تحميل البيانات",
    breadcrumb: "مسار الصفحة",
  },
  en: {
    siteName: "Where To Go",
    docTitle: "Where To Go in {city} | Cafes, restaurants & things to do",
    langButton: "العربية",
    citySwitch: "Choose a city",
    searchLabel: "Search for a place",
    searchPlaceholder: "Search a place or area…",
    heroTitle: "Where to go in {city}?",
    placesTitle: "Top rated in {city}",
    placesSub: "Ranked by weighted rating: the rating and the number of reviews together",
    tabsLabel: "Category",
    all: "All", cafes: "Cafes", restaurants: "Restaurants", fun: "Things to do",
    familyOnly: "Family friendly only",
    count: "{n} places",
    empty: "No place matches your search. Try another word or category.",
    planTitle: "Your day in {city}",
    planLabel: "Plan type",
    best: "Best", family: "Family", budget: "Budget",
    morning: "Morning", breakfast: "Breakfast & coffee",
    forenoon: "Late morning", tour: "Explore",
    noon: "Noon", lunch: "Lunch",
    afternoon: "Afternoon", coffee: "Afternoon coffee",
    night: "Evening", dinner: "Dinner",
    planNone: "No matching place yet",
    footerSource: "Ratings and review counts are taken from Google Maps, last checked on {date}.",
    footerAuthor: "Where To Go · a personal project by Ahmed Algaoni",
    reviewsCount: "({n} reviews)",
    details: "Details & reviews",
    map: "Map",
    openMap: "Open {name} in Google Maps",
    familyTag: "Family friendly",
    dataError: "Could not load the data. Run the site from a local server (python -m http.server).",
    placeDocTitle: "{name} | Where To Go in {city}",
    back: "Back to {city}",
    googleLabel: "Google Maps rating",
    visitorsLabel: "Where To Go visitors",
    fromReviews: "from {n} reviews",
    fromVisitors: "from {n} visitors",
    beFirst: "Be the first to rate",
    hood: "Neighborhood", price: "Price", familyFriendly: "Family friendly", hours: "Opening hours",
    yes: "Yes", no: "No",
    hoursUnknown: "Not listed, check the map",
    openInMaps: "Open in Google Maps",
    sourceNote: "Rating source: Google Maps · last checked {date}",
    formTitle: "Been here? Rate it",
    yourRating: "Your rating",
    starHint: "Tap the stars: 1 to 5",
    starLabel: "{n} of 5 · {word}",
    starWords: ["", "Poor", "Fair", "Good", "Very good", "Excellent"],
    starAria: "{n} of 5",
    nameLabel: "Your name (optional)",
    namePlaceholder: "e.g. a visitor from Riyadh",
    commentLabel: "Your comment",
    commentPlaceholder: "What did you like? What didn't you like?",
    submit: "Send rating",
    localNote: "Note: ratings are only saved on your device for now (demo); a real database comes later.",
    errNoStars: "Choose the number of stars first.",
    errShort: "Write at least a short comment.",
    errSave: "We couldn't save your rating in this browser.",
    errDigits: "Names can't contain numbers.",
    thanks: "Thank you! Your rating was added.",
    reviewsTitle: "Visitor reviews",
    noReviews: "No reviews yet. Share your experience!",
    visitor: "Visitor",
    similarTitle: "More {cats} in {city}",
    plural: { cafe: "cafes", restaurant: "restaurants", entertainment: "things to do" },
    notFound: "We couldn't find this place",
    notFoundText: "The link is wrong or the place was removed. ",
    goHome: "Go to the home page",
    loadError: "Could not load the data",
    breadcrumb: "Breadcrumb",
  },
};

const CITY_TEXT = {
  ar: {
    riyadh: { name: "الرياض", kicker: "العاصمة", tagline: "من الدرعية والبجيري إلى مقاهي الأحياء الجديدة." },
    qassim: { name: "القصيم", kicker: "أرض النخيل والتمور", tagline: "قهوة وتمر وأماكن تستاهل الزيارة في بريدة وعنيزة." },
    khobar: { name: "الخبر", kicker: "على ساحل الخليج", tagline: "الكورنيش والبحر، ومطاعم ومقاهي بإطلالة." },
    jeddah: { name: "جدة", kicker: "عروس البحر الأحمر", tagline: "من رواشين البلد إلى الواجهة البحرية." },
  },
  en: {
    riyadh: { name: "Riyadh", kicker: "The capital", tagline: "From Diriyah and Bujairi to cafes in the new neighborhoods." },
    qassim: { name: "Qassim", kicker: "Land of palms and dates", tagline: "Coffee, dates and places worth the trip in Buraydah and Unaizah." },
    khobar: { name: "Al Khobar", kicker: "On the Gulf coast", tagline: "The Corniche, the sea, and restaurants and cafes with a view." },
    jeddah: { name: "Jeddah", kicker: "Bride of the Red Sea", tagline: "From the latticed houses of Al Balad to the waterfront." },
  },
};

const CATEGORY_TEXT = {
  ar: { cafe: "كوفي", restaurant: "مطعم", entertainment: "ترفيه" },
  en: { cafe: "Cafe", restaurant: "Restaurant", entertainment: "Things to do" },
};

const PRICE_TEXT = {
  ar: ["", "رخيص", "متوسط", "غالي", "غالي جداً"],
  en: ["", "Cheap", "Moderate", "Expensive", "Very expensive"],
};

function t(key, vars = {}) {
  const value = STRINGS[LANG][key] ?? STRINGS.ar[key] ?? key;
  if (typeof value !== "string") return value;
  return value.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
}

function setLanguage(lang) {
  try { localStorage.setItem("lang", lang); } catch { /* ignore */ }
  location.reload();
}

// Fill static elements: data-i18n (text), data-i18n-ph (placeholder), data-i18n-aria (aria-label)
function applyStaticText() {
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
  const langBtn = document.getElementById("lang-btn");
  if (langBtn) {
    langBtn.lang = LANG === "ar" ? "en" : "ar";
    langBtn.addEventListener("click", () => setLanguage(LANG === "ar" ? "en" : "ar"));
  }
}
