// Shared code for index.html and place.html (load after i18n.js)

const CITIES = CITY_TEXT[LANG];
const CATEGORY_LABELS = CATEGORY_TEXT[LANG];
const PRICE_LABELS = PRICE_TEXT[LANG];

// Weighted rating: a 4.9 from 20 reviews should not beat a 4.7 from 5,000.
// MIN_VOTES is how many reviews a place needs before we trust its own rating.
const MIN_VOTES = 500;

const LOCALE = LANG === "ar" ? "ar-SA" : "en-US";
const numberFmt = new Intl.NumberFormat(LOCALE);
const ratingFmt = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const rankFmt = new Intl.NumberFormat(LOCALE, { minimumIntegerDigits: 2 });

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

// Loads places and adds display fields in the current language:
// p.name, p.altName, p.hood, p.tags, p.hours, p.score
async function loadPlaces() {
  const [data, en] = await Promise.all([
    fetchJson("data/places.json"),
    fetchJson("data/translations_en.json"),
  ]);
  for (const p of data.places) {
    const isEn = LANG === "en";
    p.name = isEn ? p.name_en : p.name_ar;
    p.altName = isEn ? p.name_ar : p.name_en;
    // Fall back to Arabic if a translation is missing
    p.hood = isEn ? en.neighborhoods[p.neighborhood_ar] ?? p.neighborhood_ar : p.neighborhood_ar;
    p.tags = p.tags_ar.map((tag) => (isEn ? en.tags[tag] ?? tag : tag));
    p.hours = isEn ? en.hours[p.hours_ar] ?? p.hours_ar : p.hours_ar;
  }
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
  span.setAttribute("aria-label", `${t("price")}: ${PRICE_LABELS[level]}`);
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
  const locale = LANG === "ar" ? "ar-SA-u-ca-gregory" : "en-GB";
  return new Date(isoDate).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
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
