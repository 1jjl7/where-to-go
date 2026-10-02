// وين أروح - place details page: place.html?id=riyadh-cafe-01
// Visitor reviews are stored in this browser only (localStorage) until a
// real database is added in phase 2.

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
  document.title = t("placeDocTitle", { name: place.name, city: city.name });

  $("hero-img").src = `assets/img/${place.city}.jpg`;
  $("back-link").href = `index.html#${place.city}`;
  $("back-link").textContent = t("back", { city: city.name });
  $("crumb-city").href = `index.html#${place.city}`;
  $("crumb-city").textContent = city.name;
  $("crumb-cat").textContent = CATEGORY_LABELS[place.category];
  $("place-name").textContent = place.name;
  $("place-name-alt").textContent = place.altName;
  $("place-name-alt").dir = LANG === "ar" ? "ltr" : "rtl";

  $("google-rating").textContent = `${ratingFmt.format(place.google_rating)} ★`;
  $("google-count").textContent = t("fromReviews", { n: numberFmt.format(place.google_reviews_count) });

  $("fact-hood").textContent = place.hood;
  $("fact-price").replaceChildren(priceElement(place.price_level), ` ${PRICE_LABELS[place.price_level]}`);
  $("fact-family").textContent = place.family_friendly ? t("yes") : t("no");
  $("fact-hours").textContent = place.hours || t("hoursUnknown");

  const tags = $("place-tags");
  for (const tag of place.tags) {
    const li = document.createElement("li");
    li.textContent = tag;
    tags.append(li);
  }

  $("maps-link").href = place.maps_url;
  $("source-note").textContent = t("sourceNote", { date: formatDate(place.rating_checked_on) });

  renderVisitorScore();
  renderReviews();
  renderSimilar(all);
}

function renderVisitorScore() {
  const reviews = getReviews();
  if (reviews.length === 0) {
    $("visitor-rating").textContent = "—";
    $("visitor-count").textContent = t("beFirst");
    return;
  }
  const avg = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
  $("visitor-rating").textContent = `${ratingFmt.format(avg)} ★`;
  $("visitor-count").textContent = t("fromVisitors", { n: numberFmt.format(reviews.length) });
}

function renderReviews() {
  const list = $("reviews-list");
  list.replaceChildren();
  const reviews = getReviews().slice().reverse(); // newest first

  if (reviews.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = t("noReviews");
    list.append(li);
    return;
  }

  for (const r of reviews) {
    const li = document.createElement("li");
    li.className = "review";
    const head = document.createElement("div");
    head.className = "review-head";
    const who = document.createElement("strong");
    who.textContent = r.name || t("visitor");
    const when = document.createElement("span");
    when.textContent = formatDate(r.date);
    head.append(who, when);
    const stars = document.createElement("span");
    stars.className = "review-stars";
    stars.textContent = "★".repeat(r.stars) + "☆".repeat(5 - r.stars);
    stars.setAttribute("aria-label", t("starAria", { n: numberFmt.format(r.stars) }));
    const text = document.createElement("p");
    text.textContent = r.text;
    li.append(head, stars, text);
    list.append(li);
  }
}

function renderSimilar(all) {
  $("similar-title").textContent = t("similarTitle", {
    cats: t("plural")[place.category],
    city: CITIES[place.city].name,
  });
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
    name.textContent = p.name;
    const sub = document.createElement("span");
    sub.textContent = `${ratingFmt.format(p.google_rating)} ★ · ${p.hood}`;
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
    b.setAttribute("aria-label", t("starAria", { n: numberFmt.format(n) }));
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => setStars(n));
    // Hovering previews how many stars you are about to give
    b.addEventListener("mouseenter", () => previewStars(n));
    b.addEventListener("mouseleave", () => previewStars(0));
    row.append(b);
  }
  $("star-label").textContent = t("starHint");
}

function previewStars(n) {
  document.querySelectorAll(".star-btn").forEach((b, i) => b.classList.toggle("preview", i < n));
}

function setStars(n) {
  chosenStars = n;
  document.querySelectorAll(".star-btn").forEach((b, i) => {
    b.classList.toggle("on", i < n);
    b.setAttribute("aria-pressed", String(i + 1 === n));
  });
  $("star-label").textContent = n ? t("starLabel", { n: numberFmt.format(n), word: t("starWords")[n] }) : t("starHint");
  $("form-error").textContent = "";
}

// Names must not contain digits (Western 0-9, Arabic ٠-٩, Persian ۰-۹).
// No "g" flag on HAS_DIGIT: a global regex remembers lastIndex between .test() calls.
const HAS_DIGIT = /[0-9٠-٩۰-۹]/;
const ALL_DIGITS = /[0-9٠-٩۰-۹]/g;

function onNameInput(e) {
  if (HAS_DIGIT.test(e.target.value)) {
    e.target.value = e.target.value.replace(ALL_DIGITS, "");
    $("form-error").textContent = t("errDigits");
  }
}

function onSubmit(e) {
  e.preventDefault();
  const name = $("review-name").value.trim();
  const text = $("review-text").value.trim();
  if (!chosenStars) { $("form-error").textContent = t("errNoStars"); return; }
  if (HAS_DIGIT.test(name)) { $("form-error").textContent = t("errDigits"); return; }
  if (text.length < 3) { $("form-error").textContent = t("errShort"); return; }

  const reviews = getReviews();
  reviews.push({ stars: chosenStars, name, text, date: new Date().toISOString() });
  if (!storage.set(reviewsKey(), reviews)) {
    $("form-error").textContent = t("errSave");
    return;
  }

  e.target.reset();
  setStars(0);
  $("star-label").textContent = t("thanks");
  renderVisitorScore();
  renderReviews();
}

// ---------- start ----------

function showNotFound() {
  $("place-name").textContent = t("notFound");
  $("place-main").replaceChildren();
  const p = document.createElement("p");
  p.className = "empty";
  const a = document.createElement("a");
  a.href = "index.html";
  a.textContent = t("goHome");
  p.append(t("notFoundText"), a);
  $("place-main").append(p);
}

async function init() {
  applyStaticText();
  const id = new URLSearchParams(location.search).get("id");
  let all;
  try {
    all = await loadPlaces();
  } catch (err) {
    console.error(err);
    $("place-name").textContent = t("loadError");
    return;
  }
  place = all.find((p) => p.id === id);
  if (!place) { showNotFound(); return; }

  buildStars();
  $("review-form").addEventListener("submit", onSubmit);
  $("review-name").addEventListener("input", onNameInput);
  renderPlace(all);
}

init();
