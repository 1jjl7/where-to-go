# وين أروح - City guide

Static site (HTML/CSS/JS) for 4 Saudi cities: riyadh, qassim, khobar, jeddah.

- Data: data/places.json (schema in data/place_template.json)
- Validate after every change: python check_places.py
- Add places: send Google Maps link + rating | reviews | price | family | neighborhood
- Design: 4 pages per city (Home, Place, DayPlan, Mobile), one palette per city
- Never invent ratings; every place is verified on Google Maps with a date
- Hero photos: check licenses before publishing
- Pages: index.html (script.js), place.html?id=... (place.js); shared code in common.js
- Languages: UI text in i18n.js (ar/en); neighborhood/tag/hours English in
  data/translations_en.json (check_places.py warns if one is missing)
- Script order on every page: i18n.js, common.js, page script
- Build DOM with textContent, never innerHTML with data
- Run locally: python -m http.server 8000
