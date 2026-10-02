// وين أروح - home page logic (shared helpers live in common.js)
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
    const haystack = normalize([p.name_ar, p.name_en, p.neighborhood_ar, ...p.tags_ar].join(" "));
    return haystack.includes(q);
  });
}

// ---------- rendering ----------

function renderHero() {
  const c = CITIES[state.city];
  document.getElementById("hero-kicker").textContent = c.kicker;
  document.getElementById("hero-title").textContent = `وين تروح في ${c.name}؟`;
  document.getElementById("hero-tagline").textContent = c.tagline;
  document.getElementById("places-title").textContent = `الأعلى تقييماً في ${c.name}`;
  document.getElementById("plan-title").textContent = `يومك في ${c.name}`;
  document.title = `وين أروح في ${c.name} | دليل الكوفيهات والمطاعم والترفيه`;

  document.querySelectorAll(".city-switch button").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.city === state.city));
  });
}

function renderCards() {
  const list = visiblePlaces();
  const container = document.getElementById("cards");
  const template = document.getElementById("card-template");
  container.replaceChildren();

  document.getElementById("results-count").textContent = `${numberFmt.format(list.length)} مكان`;

  if (list.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "ما لقينا مكان يطابق بحثك. جرّب كلمة ثانية أو تصنيف ثاني.";
    container.append(empty);
    return;
  }

  list.forEach((p, i) => {
    const card = template.content.cloneNode(true);
    card.querySelector(".card").style.animationDelay = `${Math.min(i, 10) * 40}ms`;
    card.querySelector(".rank").textContent = rankFmt.format(i + 1);
    card.querySelector(".cat").textContent = CATEGORY_LABELS[p.category];
    const nameLink = card.querySelector(".name a");
    nameLink.textContent = p.name_ar;
    nameLink.href = `place.html?id=${encodeURIComponent(p.id)}`;
    card.querySelector(".name-en").textContent = p.name_en;
    card.querySelector(".score").textContent = ratingFmt.format(p.google_rating);
    card.querySelector(".reviews").textContent = `(${numberFmt.format(p.google_reviews_count)} تقييم)`;
    card.querySelector(".hood").textContent = p.neighborhood_ar;
    card.querySelector(".price").replaceWith(priceElement(p.price_level));

    const tags = card.querySelector(".tags");
    const extra = p.family_friendly ? ["مناسب للعوائل"] : [];
    for (const t of [...p.tags_ar, ...extra]) {
      const li = document.createElement("li");
      li.textContent = t;
      tags.append(li);
    }

    const link = card.querySelector(".maps");
    link.href = p.maps_url;
    link.setAttribute("aria-label", `افتح ${p.name_ar} في خرائط Google`);

    const details = card.querySelector(".details");
    details.href = nameLink.href;
    details.setAttribute("aria-label", `تفاصيل ${p.name_ar} وتقييمه`);
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
    { when: "الصباح", what: "فطور وقهوة", place: pick("cafe", 0) },
    { when: "الضحى", what: "جولة", place: pick("entertainment", 0) },
    { when: "الظهر", what: "غداء", place: pick("restaurant", 0) },
    { when: "العصر", what: "قهوة العصر", place: pick("cafe", 1) },
    { when: "الليل", what: "عشاء", place: pick("restaurant", 1) },
  ];

  const ol = document.getElementById("plan");
  ol.replaceChildren();
  for (const s of steps) {
    const li = document.createElement("li");
    const when = document.createElement("span");
    when.className = "when";
    when.textContent = s.when;
    const what = document.createElement("span");
    what.className = "what";
    what.textContent = s.what;
    li.append(when, what);

    if (s.place) {
      const a = document.createElement("a");
      a.href = s.place.maps_url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = s.place.name_ar;
      const sub = document.createElement("span");
      sub.className = "sub";
      sub.textContent = `${ratingFmt.format(s.place.google_rating)} ★ · ${s.place.neighborhood_ar}`;
      li.append(a, sub);
    } else {
      const sub = document.createElement("span");
      sub.className = "sub";
      sub.textContent = "ما فيه مكان مناسب بعد";
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
  try { localStorage.setItem("city", city); } catch { /* storage may be blocked */ }
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
  try {
    const saved = localStorage.getItem("city");
    if (CITIES[saved]) return saved;
  } catch { /* ignore */ }
  return "riyadh";
}

async function init() {
  bindEvents();
  state.city = startingCity();
  try {
    places = await loadPlaces();
  } catch (err) {
    document.getElementById("cards").textContent = "تعذّر تحميل البيانات. شغّل الموقع من خادم محلي (python -m http.server).";
    console.error(err);
    return;
  }

  const latest = places.map((p) => p.rating_checked_on).sort().at(-1);
  document.getElementById("checked-date").textContent = formatDate(latest);

  renderAll();
}

init();
