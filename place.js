// وين أروح - place details page: place.html?id=riyadh-cafe-01
// Visitor reviews are stored in this browser only (localStorage) until a
// real database is added in phase 2.

const STAR_WORDS = ["", "سيئ", "مقبول", "جيد", "جيد جداً", "ممتاز"];

let place = null;
let chosenStars = 0;

const $ = (id) => document.getElementById(id);
const reviewsKey = () => `reviews:${place.id}`;

function getReviews() {
  return storage.get(reviewsKey(), []);
}

// ---------- rendering ----------

function renderPlace(all) {
  const city = CITIES[place.city];
  document.body.dataset.city = place.city;
  document.title = `${place.name_ar} | وين أروح في ${city.name}`;

  $("hero-img").src = `assets/img/${place.city}.jpg`;
  $("back-link").href = `index.html#${place.city}`;
  $("back-link").textContent = `رجوع إلى ${city.name}`;
  $("crumb-city").href = `index.html#${place.city}`;
  $("crumb-city").textContent = city.name;
  $("crumb-cat").textContent = CATEGORY_LABELS[place.category];
  $("place-name").textContent = place.name_ar;
  $("place-name-en").textContent = place.name_en;

  $("google-rating").textContent = `${ratingFmt.format(place.google_rating)} ★`;
  $("google-count").textContent = `من ${numberFmt.format(place.google_reviews_count)} تقييم`;

  $("fact-hood").textContent = place.neighborhood_ar;
  $("fact-price").replaceChildren(priceElement(place.price_level), ` ${PRICE_LABELS[place.price_level]}`);
  $("fact-family").textContent = place.family_friendly ? "نعم" : "لا";
  $("fact-hours").textContent = place.hours_ar || "غير مذكورة، تأكد من الخريطة";

  const tags = $("place-tags");
  for (const t of place.tags_ar) {
    const li = document.createElement("li");
    li.textContent = t;
    tags.append(li);
  }

  $("maps-link").href = place.maps_url;
  $("source-note").textContent = `مصدر التقييم: خرائط Google · آخر تحقق: ${formatDate(place.rating_checked_on)}`;

  renderVisitorScore();
  renderReviews();
  renderSimilar(all);
}

function renderVisitorScore() {
  const reviews = getReviews();
  if (reviews.length === 0) {
    $("visitor-rating").textContent = "—";
    $("visitor-count").textContent = "كن أول من يقيّم";
    return;
  }
  const avg = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
  $("visitor-rating").textContent = `${ratingFmt.format(avg)} ★`;
  $("visitor-count").textContent = `من ${numberFmt.format(reviews.length)} زائر`;
}

function renderReviews() {
  const list = $("reviews-list");
  list.replaceChildren();
  const reviews = getReviews().slice().reverse(); // newest first

  if (reviews.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "ما فيه آراء للحين. شاركنا تجربتك!";
    list.append(li);
    return;
  }

  for (const r of reviews) {
    const li = document.createElement("li");
    li.className = "review";
    const head = document.createElement("div");
    head.className = "review-head";
    const who = document.createElement("strong");
    who.textContent = r.name || "زائر";
    const when = document.createElement("span");
    when.textContent = formatDate(r.date);
    head.append(who, when);
    const stars = document.createElement("span");
    stars.className = "review-stars";
    stars.textContent = "★".repeat(r.stars) + "☆".repeat(5 - r.stars);
    stars.setAttribute("aria-label", `${r.stars} من ٥`);
    const text = document.createElement("p");
    text.textContent = r.text;
    li.append(head, stars, text);
    list.append(li);
  }
}

function renderSimilar(all) {
  const plural = { cafe: "كوفيهات", restaurant: "مطاعم", entertainment: "أماكن ترفيه" };
  $("similar-title").textContent = `${plural[place.category]} ثانية في ${CITIES[place.city].name}`;
  const others = all
    .filter((p) => p.city === place.city && p.category === place.category && p.id !== place.id)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const box = $("similar");
  for (const p of others) {
    const a = document.createElement("a");
    a.className = "mini-card";
    a.href = `place.html?id=${encodeURIComponent(p.id)}`;
    const name = document.createElement("strong");
    name.textContent = p.name_ar;
    const sub = document.createElement("span");
    sub.textContent = `${ratingFmt.format(p.google_rating)} ★ · ${p.neighborhood_ar}`;
    a.append(name, sub);
    box.append(a);
  }
}

// ---------- review form ----------

function buildStars() {
  const row = $("stars-row");
  for (let n = 1; n <= 5; n++) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "star-btn";
    b.textContent = "★";
    b.setAttribute("aria-label", `${n} من ٥`);
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => setStars(n));
    row.append(b);
  }
}

function setStars(n) {
  chosenStars = n;
  document.querySelectorAll(".star-btn").forEach((b, i) => {
    b.classList.toggle("on", i < n);
    b.setAttribute("aria-pressed", String(i + 1 === n));
  });
  $("star-label").textContent = `${numberFmt.format(n)} من ٥ · ${STAR_WORDS[n]}`;
  $("form-error").textContent = "";
}

function onSubmit(e) {
  e.preventDefault();
  const text = $("review-text").value.trim();
  if (!chosenStars) { $("form-error").textContent = "اختر عدد النجوم أول."; return; }
  if (text.length < 3) { $("form-error").textContent = "اكتب تعليق قصير على الأقل."; return; }

  const reviews = getReviews();
  reviews.push({ stars: chosenStars, name: $("review-name").value.trim(), text, date: new Date().toISOString() });
  if (!storage.set(reviewsKey(), reviews)) {
    $("form-error").textContent = "ما قدرنا نحفظ التقييم في هذا المتصفح.";
    return;
  }

  e.target.reset();
  setStars(0);
  $("star-label").textContent = "شكراً لك! انضاف تقييمك.";
  renderVisitorScore();
  renderReviews();
}

// ---------- start ----------

function showNotFound() {
  $("place-name").textContent = "ما لقينا هذا المكان";
  $("place-main").replaceChildren();
  const p = document.createElement("p");
  p.className = "empty";
  const a = document.createElement("a");
  a.href = "index.html";
  a.textContent = "ارجع للصفحة الرئيسية";
  p.append("الرابط غير صحيح أو المكان انحذف. ", a);
  $("place-main").append(p);
}

async function init() {
  const id = new URLSearchParams(location.search).get("id");
  let all;
  try {
    all = await loadPlaces();
  } catch (err) {
    console.error(err);
    $("place-name").textContent = "تعذّر تحميل البيانات";
    return;
  }
  place = all.find((p) => p.id === id);
  if (!place) { showNotFound(); return; }

  buildStars();
  $("review-form").addEventListener("submit", onSubmit);
  renderPlace(all);
}

init();
