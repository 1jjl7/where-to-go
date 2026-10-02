// Shared code for index.html and place.html

const CITIES = {
  riyadh: { name: "الرياض", kicker: "العاصمة", tagline: "من الدرعية والبجيري إلى مقاهي الأحياء الجديدة." },
  qassim: { name: "القصيم", kicker: "أرض النخيل والتمور", tagline: "قهوة وتمر وأماكن تستاهل الزيارة في بريدة وعنيزة." },
  khobar: { name: "الخبر", kicker: "على ساحل الخليج", tagline: "الكورنيش والبحر، ومطاعم ومقاهي بإطلالة." },
  jeddah: { name: "جدة", kicker: "عروس البحر الأحمر", tagline: "من رواشين البلد إلى الواجهة البحرية." },
};

const CATEGORY_LABELS = { cafe: "كوفي", restaurant: "مطعم", entertainment: "ترفيه" };
const PRICE_LABELS = ["", "رخيص", "متوسط", "غالي", "غالي جداً"];

// Weighted rating: a 4.9 from 20 reviews should not beat a 4.7 from 5,000.
// MIN_VOTES is how many reviews a place needs before we trust its own rating.
const MIN_VOTES = 500;

const numberFmt = new Intl.NumberFormat("ar-SA");
const ratingFmt = new Intl.NumberFormat("ar-SA", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const rankFmt = new Intl.NumberFormat("ar-SA", { minimumIntegerDigits: 2 });

async function loadPlaces() {
  const response = await fetch("data/places.json");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  addWeightedScores(data.places);
  return data.places;
}

function addWeightedScores(list) {
  // C = average rating of the same city + category
  const groups = {};
  for (const p of list) {
    const key = `${p.city}|${p.category}`;
    (groups[key] ||= []).push(p.google_rating);
  }
  for (const p of list) {
    const ratings = groups[`${p.city}|${p.category}`];
    const C = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const v = p.google_reviews_count;
    p.score = (v / (v + MIN_VOTES)) * p.google_rating + (MIN_VOTES / (v + MIN_VOTES)) * C;
  }
}

function priceElement(level) {
  const span = document.createElement("span");
  span.className = "price";
  span.setAttribute("aria-label", `السعر: ${PRICE_LABELS[level]}`);
  for (let i = 1; i <= 4; i++) {
    const dot = document.createElement("span");
    dot.textContent = "●";
    if (i > level) dot.className = "off";
    dot.setAttribute("aria-hidden", "true");
    span.append(dot);
  }
  return span;
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString("ar-SA-u-ca-gregory", { year: "numeric", month: "long", day: "numeric" });
}

// localStorage can throw (private mode, blocked storage), so wrap it
const storage = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  },
};
