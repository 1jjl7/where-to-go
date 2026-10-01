"""Validate data/places.json before the site uses it.

Run:  python check_places.py            (checks data/places.json)
      python check_places.py other.json (checks another file)

Errors   = data that would break the site or show something illogical.
Warnings = data that works but looks suspicious or incomplete.
Exit code is 1 when there is at least one error.
"""

import json
import re
import sys
from collections import Counter
from datetime import date
from pathlib import Path

CITIES = {"riyadh", "qassim", "khobar", "jeddah"}
CATEGORIES = {"cafe", "restaurant", "entertainment"}

# field name -> expected Python type
FIELDS = {
    "id": str,
    "city": str,
    "category": str,
    "name_ar": str,
    "name_en": str,
    "neighborhood_ar": str,
    "google_rating": (int, float),
    "google_reviews_count": int,
    "rating_checked_on": str,
    "price_level": int,
    "family_friendly": bool,
    "tags_ar": list,
    "hours_ar": str,
    "best_time_ar": str,
    "maps_url": str,
    "description_ar": str,
}
REQUIRED_TEXT = ["name_ar", "name_en", "neighborhood_ar", "maps_url"]

MAPS_PREFIXES = (
    "https://maps.app.goo.gl/",
    "https://goo.gl/maps/",
    "https://www.google.com/maps",
    "https://maps.google.com/",
)

TARGET_PER_CATEGORY = 5   # top 5 per category per city
MIN_REVIEWS = 50          # fewer reviews = rating is not reliable
MAX_RATING_AGE_DAYS = 90  # re-check ratings older than this
MAX_TAGS = 5
MAX_DESCRIPTION = 200

# What the "day plan" needs: breakfast + coffee, lunch + dinner, one activity
DAY_PLAN_NEEDS = {"cafe": 2, "restaurant": 2, "entertainment": 1}

errors = []
warnings = []


def error(place_id, message):
    errors.append(f"[{place_id}] {message}")


def warn(place_id, message):
    warnings.append(f"[{place_id}] {message}")


def check_types(pid, place):
    for field, expected in FIELDS.items():
        if field not in place:
            error(pid, f"missing field '{field}'")
            continue
        value = place[field]
        # bool is a subclass of int in Python, so reject it for number fields
        if isinstance(value, bool) and expected is not bool:
            error(pid, f"'{field}' must not be true/false")
        elif not isinstance(value, expected):
            error(pid, f"'{field}' has the wrong type ({type(value).__name__})")

    for field in place:
        if field not in FIELDS:
            warn(pid, f"unknown field '{field}' (typo?)")


def check_values(pid, place):
    city = place.get("city")
    category = place.get("category")

    if city not in CITIES:
        error(pid, f"city '{city}' must be one of {sorted(CITIES)}")
    if category not in CATEGORIES:
        error(pid, f"category '{category}' must be one of {sorted(CATEGORIES)}")

    # id must look like riyadh-cafe-01 and agree with city/category
    if not re.fullmatch(r"[a-z]+-[a-z]+-\d{2}", str(pid)):
        error(pid, "id must look like 'riyadh-cafe-01'")
    elif not str(pid).startswith(f"{city}-{category}-"):
        error(pid, f"id does not match city/category ('{city}-{category}-NN')")

    for field in REQUIRED_TEXT:
        if isinstance(place.get(field), str) and not place[field].strip():
            error(pid, f"'{field}' is empty")

    rating = place.get("google_rating")
    count = place.get("google_reviews_count")
    if isinstance(rating, (int, float)) and not isinstance(rating, bool):
        if not 1.0 <= rating <= 5.0:
            error(pid, f"google_rating {rating} must be between 1.0 and 5.0")
        elif round(rating, 1) != rating:
            warn(pid, f"google_rating {rating} has more than one decimal")
    if isinstance(count, int) and not isinstance(count, bool):
        if count <= 0:
            error(pid, "google_reviews_count must be more than 0")
        elif count < MIN_REVIEWS:
            warn(pid, f"only {count} reviews - rating may not be reliable")

    checked = place.get("rating_checked_on")
    if isinstance(checked, str):
        try:
            checked_date = date.fromisoformat(checked)
        except ValueError:
            error(pid, f"rating_checked_on '{checked}' must be YYYY-MM-DD")
        else:
            age = (date.today() - checked_date).days
            if age < 0:
                error(pid, "rating_checked_on is in the future")
            elif age > MAX_RATING_AGE_DAYS:
                warn(pid, f"rating checked {age} days ago - re-check it")

    price = place.get("price_level")
    if isinstance(price, int) and not isinstance(price, bool) and not 1 <= price <= 4:
        error(pid, f"price_level {price} must be 1 to 4")

    url = place.get("maps_url")
    if isinstance(url, str) and url.strip() and not url.startswith(MAPS_PREFIXES):
        error(pid, "maps_url is not a Google Maps link")

    tags = place.get("tags_ar")
    if isinstance(tags, list):
        if len(tags) > MAX_TAGS:
            warn(pid, f"{len(tags)} tags - the card shows {MAX_TAGS} at most")
        if not all(isinstance(t, str) and t.strip() for t in tags):
            error(pid, "tags_ar must contain non-empty text only")

    description = place.get("description_ar")
    if isinstance(description, str) and len(description) > MAX_DESCRIPTION:
        warn(pid, f"description is {len(description)} characters (max {MAX_DESCRIPTION})")


def check_duplicates(places):
    ids = Counter(p.get("id") for p in places)
    for pid, n in ids.items():
        if n > 1:
            error(pid, f"id used {n} times")

    urls = Counter(p.get("maps_url") for p in places if p.get("maps_url"))
    for url, n in urls.items():
        if n > 1:
            error("-", f"same maps_url used {n} times: {url}")

    names = Counter((p.get("city"), p.get("name_ar")) for p in places if p.get("name_ar"))
    for (city, name), n in names.items():
        if n > 1:
            warn("-", f"'{name}' appears {n} times in {city}")


def check_coverage(places):
    """Warn when a city page or its day plan would look empty."""
    counts = Counter((p.get("city"), p.get("category")) for p in places)
    family = Counter((p.get("city"), p.get("category"))
                     for p in places if p.get("family_friendly") is True)

    for city in sorted(CITIES):
        for category in sorted(CATEGORIES):
            n = counts[(city, category)]
            if n < TARGET_PER_CATEGORY:
                warn(city, f"{category}: {n}/{TARGET_PER_CATEGORY} places")
        for category, need in DAY_PLAN_NEEDS.items():
            if counts[(city, category)] < need:
                warn(city, f"day plan needs {need} {category} place(s)")
            elif family[(city, category)] < need:
                warn(city, f"family day plan needs {need} family-friendly {category} place(s)")


def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("data/places.json")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"File not found: {path}")
        return 1
    except json.JSONDecodeError as e:
        print(f"JSON syntax error in {path}, line {e.lineno}: {e.msg}")
        return 1

    places = data.get("places") if isinstance(data, dict) else None
    if not isinstance(places, list):
        print('The file must look like {"schema_version": 1, "places": [...]}')
        return 1

    for i, place in enumerate(places):
        if not isinstance(place, dict):
            error(f"#{i + 1}", "each place must be an object { ... }")
            continue
        pid = place.get("id", f"#{i + 1}")
        check_types(pid, place)
        check_values(pid, place)

    check_duplicates([p for p in places if isinstance(p, dict)])
    check_coverage([p for p in places if isinstance(p, dict)])

    print(f"Checked {len(places)} place(s) in {path}\n")
    if errors:
        print(f"ERRORS ({len(errors)}) - fix these before using the data:")
        for line in errors:
            print("  x", line)
        print()
    if warnings:
        print(f"WARNINGS ({len(warnings)}):")
        for line in warnings:
            print("  !", line)
        print()
    print("Result:", "FAILED" if errors else "OK")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
