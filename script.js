// وين أروح - home page logic (text in i18n.js, shared helpers in common.js)
// Loads data/places.json, ranks places, and renders cards + a day plan
// for the selected city. Colours/fonts come from CSS (body[data-city]).

const state = { city: "riyadh", cat: "all", familyOnly: false, query: "", planMode: "best" };
let places = [];

// ---------- data helpers ----------

// Make Arabic search forgiving: أ/إ/آ -> ا, ة -> ه, ى -> ي, no diacritics
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
}

function cityPlaces() {
  return places.filter((p) => p.city === state.city).sort((a, b) => b.score - a.score);
}

function visiblePlaces() {
  const q = normalize(state.query.trim());
  return cityPlaces().filter((p) => {
    if (state.cat !== "all" && p.category !== state.cat) return false;
    if (state.familyOnly && !p.family_friendly) return false;
    if (!q) return true;
    // Search both languages, so "Jareed" and "جريد" both work
    const haystack = normalize([p.name_ar, p.name_en, p.neighborhood_ar, p.hood, ...p.tags_ar, ...p.tags].join(" "));
    return haystack.includes(q);
  });
}

// ---------- rendering ----------

function renderHero() {
  const c = CITIES[state.city];
  document.getElementById("hero-kicker").textContent = c.kicker;
  document.getElementById("hero-title").textContent = t("heroTitle", { city: c.name });
  document.getElementById("hero-tagline").textContent = c.tagline;
  document.getElementById("places-title").textContent = t("placesTitle", { city: c.name });
  document.getElementById("plan-title").textContent = t("planTitle", { city: c.name });
  document.title = t("docTitle", { city: c.name });

  document.querySelectorAll(".city-switch button").forEach((b) => {
    b.textContent = CITIES[b.dataset.city].name;
    b.setAttribute("aria-pressed", String(b.dataset.city === state.city));
  });
}

function renderCards() {
  const list = visiblePlaces();
  const container = document.getElementById("cards");
  const template = document.getElementById("card-template");
  container.replaceChildren();

  document.getElementById("results-count").textContent = t("count", { n: numberFmt.format(list.length) });

  if (list.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = t("empty");
    container.append(empty);
    return;
  }

  list.forEach((p, i) => {
    const card = template.content.cloneNode(true);
    card.querySelector(".card").style.animationDelay = `${Math.min(i, 10) * 40}ms`;
    card.querySelector(".rank").textContent = rankFmt.format(i + 1);
    card.querySelector(".cat").textContent = CATEGORY_LABELS[p.category];
    const nameLink = card.querySelector(".name a");
    nameLink.textContent = p.name;
    nameLink.href = `place.html?id=${encodeURIComponent(p.id)}`;
    const alt = card.querySelector(".name-alt");
    alt.textContent = p.altName;
    alt.lang = LANG === "ar" ? "en" : "ar";
    alt.dir = LANG === "ar" ? "ltr" : "rtl";
    card.querySelector(".score").textContent = ratingFmt.format(p.google_rating);
    card.querySelector(".reviews").textContent = t("reviewsCount", { n: numberFmt.format(p.google_reviews_count) });
    card.querySelector(".hood").textContent = p.hood;
    card.querySelector(".price").replaceWith(priceElement(p.price_level));

    const tags = card.querySelector(".tags");
    const extra = p.family_friendly ? [t("familyTag")] : [];
    for (const tag of [...p.tags, ...extra]) {
      const li = document.createElement("li");
      li.textContent = tag;
      tags.append(li);
    }

    const link = card.querySelector(".maps");
    link.textContent = t("map");
    link.href = p.maps_url;
    link.setAttribute("aria-label", t("openMap", { name: p.name }));

    const details = card.querySelector(".details");
    details.textContent = t("details");
    details.href = nameLink.href;
    container.append(card);
  });
}

function renderPlan() {
  let pool = cityPlaces();
  if (state.planMode === "family") pool = pool.filter((p) => p.family_friendly);
  if (state.planMode === "budget") pool = [...pool].sort((a, b) => a.price_level - b.price_level || b.score - a.score);

  const pick = (category, n) => {
    const options = pool.filter((p) => p.category === category);
    return options[n] || options[0]; // repeat the first one if there is no second
  };

  const steps = [
    { when: "morning", what: "breakfast", place: pick("cafe", 0) },
    { when: "forenoon", what: "tour", place: pick("entertainment", 0) },
    { when: "noon", what: "lunch", place: pick("restaurant", 0) },
    { when: "afternoon", what: "coffee", place: pick("cafe", 1) },
    { when: "night", what: "dinner", place: pick("restaurant", 1) },
  ];

  const ol = document.getElementById("plan");
  ol.replaceChildren();
  for (const s of steps) {
    const li = document.createElement("li");
    const when = document.createElement("span");
    when.className = "when";
    when.textContent = t(s.when);
    const what = document.createElement("span");
    what.className = "what";
    what.textContent = t(s.what);
    li.append(when, what);

    const sub = document.createElement("span");
    sub.className = "sub";
    if (s.place) {
      const a = document.createElement("a");
      a.href = `place.html?id=${encodeURIComponent(s.place.id)}`;
      a.textContent = s.place.name;
      sub.textContent = `${ratingFmt.format(s.place.google_rating)} ★ · ${s.place.hood}`;
      li.append(a, sub);
    } else {
      sub.textContent = t("planNone");
      li.append(sub);
    }
    ol.append(li);
  }

  document.querySelectorAll("[data-mode]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.mode === state.planMode));
  });
}

function renderAll() {
  document.body.dataset.city = state.city;
  renderHero();
  renderCards();
  renderPlan();
}

// ---------- events ----------

function setCity(city) {
  if (!CITIES[city]) return;
  state.city = city;
  history.replaceState(null, "", `#${city}`);
  storage.set("city", city);
  renderAll();
}

function bindEvents() {
  document.querySelectorAll(".city-switch button").forEach((b) => {
    b.addEventListener("click", () => setCity(b.dataset.city));
  });

  document.querySelectorAll("[data-cat]").forEach((b) => {
    b.addEventListener("click", () => {
      state.cat = b.dataset.cat;
      document.querySelectorAll("[data-cat]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      renderCards();
    });
  });

  document.querySelectorAll("[data-mode]").forEach((b) => {
    b.addEventListener("click", () => {
      state.planMode = b.dataset.mode;
      renderPlan();
    });
  });

  document.getElementById("family-only").addEventListener("change", (e) => {
    state.familyOnly = e.target.checked;
    renderCards();
  });

  document.getElementById("search-input").addEventListener("input", (e) => {
    state.query = e.target.value;
    renderCards();
  });

  window.addEventListener("hashchange", () => setCity(location.hash.slice(1)));
}

function startingCity() {
  const fromHash = location.hash.slice(1);
  if (CITIES[fromHash]) return fromHash;
  const saved = storage.get("city", null);
  return CITIES[saved] ? saved : "riyadh";
}

async function init() {
  applyStaticText();
  bindEvents();
  state.city = startingCity();
  try {
    places = await loadPlaces();
  } catch (err) {
    document.getElementById("cards").textContent = t("dataError");
    console.error(err);
    return;
  }

  const latest = places.map((p) => p.rating_checked_on).sort().at(-1);
  document.getElementById("footer-source").textContent = t("footerSource", { date: formatDate(latest) });

  renderAll();
}

init();
