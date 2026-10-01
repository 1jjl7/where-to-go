"""Add places to data/places.json by answering simple questions.

Run:  python add_place.py
      python add_place.py other/places.json   (use another file, for testing)

It shows the candidates from candidates.md (same folder as places.json),
fills id and date automatically, checks every answer, saves the place,
and ticks the candidate in candidates.md.
Press Ctrl+C at any time to quit without saving the current place.
"""

import json
import re
import sys
from datetime import date
from pathlib import Path

import check_places as cp

CITY_MENU = [("riyadh", "Riyadh"), ("qassim", "Qassim"),
             ("khobar", "Al Khobar"), ("jeddah", "Jeddah")]
CATEGORY_MENU = [("cafe", "Cafe"), ("restaurant", "Restaurant"),
                 ("entertainment", "Entertainment / tourist place")]
PRICE_HELP = "1 = cheap, 2 = normal, 3 = expensive, 4 = very expensive"
ARABIC = re.compile(r"[؀-ۿ]")


# ---------- small input helpers ----------

def ask_choice(title, options):
    """Show a numbered menu and return the chosen index."""
    print(f"\n{title}")
    for i, label in enumerate(options, start=1):
        print(f"  {i}. {label}")
    while True:
        answer = input("Choose a number: ").strip()
        if answer.isdigit() and 1 <= int(answer) <= len(options):
            return int(answer) - 1
        print(f"  Please type a number from 1 to {len(options)}.")


def ask_text(question, default="", required=True):
    hint = f" [{default}]" if default else (" (Enter to skip)" if not required else "")
    while True:
        answer = input(f"{question}{hint}: ").strip() or default
        if answer or not required:
            return answer
        print("  This one is required.")


def ask_number(question, kind, low, high):
    while True:
        answer = input(f"{question}: ").strip().replace(",", "")
        try:
            value = kind(answer)
        except ValueError:
            print("  Please type a number.")
            continue
        if low <= value <= high:
            return value
        print(f"  Must be between {low} and {high}.")


def ask_yes_no(question):
    while True:
        answer = input(f"{question} (y/n): ").strip().lower()
        if answer in ("y", "yes", "n", "no"):
            return answer.startswith("y")
        print("  Please type y or n.")


def ask_maps_url(used_urls):
    while True:
        url = input("Google Maps link (Share > Copy link): ").strip()
        if not url.startswith(cp.MAPS_PREFIXES):
            print("  That is not a Google Maps link.")
        elif url in used_urls:
            print("  This link is already in places.json.")
        else:
            return url


# ---------- candidates.md ----------

def load_candidates(path):
    """Return {(city, category): [(line_index, name_en, name_ar), ...]}."""
    if not path.exists():
        return {}
    city_words = {"riyadh": "riyadh", "qassim": "qassim",
                  "khobar": "khobar", "jeddah": "jeddah"}
    result, city, category = {}, None, None
    lines = path.read_text(encoding="utf-8").splitlines()
    for i, line in enumerate(lines):
        if line.startswith("## "):
            city = next((c for w, c in city_words.items() if w in line.lower()), None)
        elif line.startswith("### "):
            match = re.search(r"\((\w+)\)", line)
            category = match.group(1) if match else None
        elif line.startswith("- [ ] ") and city and category:
            text = line[6:].split(" (")[0].strip()
            name_en, name_ar = text, ""
            if " - " in text:
                left, right = text.split(" - ", 1)
                if ARABIC.search(right):
                    name_en, name_ar = left.strip(), right.strip()
            result.setdefault((city, category), []).append((i, name_en, name_ar))
    return result


def tick_candidate(path, line_index):
    lines = path.read_text(encoding="utf-8").splitlines()
    lines[line_index] = lines[line_index].replace("- [ ] ", "- [x] ", 1)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


# ---------- main flow ----------

def next_id(places, city, category):
    prefix = f"{city}-{category}-"
    numbers = [int(p["id"][len(prefix):]) for p in places
               if str(p.get("id", "")).startswith(prefix) and p["id"][len(prefix):].isdigit()]
    return f"{prefix}{max(numbers, default=0) + 1:02d}"


def ask_place(places, candidates):
    city = CITY_MENU[ask_choice("Which city?", [label for _, label in CITY_MENU])][0]
    category = CATEGORY_MENU[ask_choice("Which category?", [label for _, label in CATEGORY_MENU])][0]

    options = candidates.get((city, category), [])
    picked = None
    if options:
        labels = [f"{en}  {ar}".strip() for _, en, ar in options] + ["Another place (type it)"]
        choice = ask_choice("Which place?", labels)
        if choice < len(options):
            picked = options[choice]

    print("\nOpen the place on Google Maps now and answer from there.")
    name_en = ask_text("English name", default=picked[1] if picked else "")
    name_ar = ask_text("Arabic name", default=picked[2] if picked else "")
    neighborhood = ask_text("Neighborhood (Arabic)")
    rating = ask_number("Google rating (e.g. 4.6)", float, 1.0, 5.0)
    reviews = ask_number("Number of Google reviews (e.g. 1250)", int, 1, 10_000_000)
    print(f"Price level: {PRICE_HELP}")
    price = ask_number("Price level", int, 1, 4)
    family = ask_yes_no("Good for families?")
    url = ask_maps_url({p.get("maps_url") for p in places})

    print("\nOptional - press Enter to skip:")
    tags_text = ask_text("Features, separated by commas (e.g. جلسات خارجية, إطلالة)", required=False)
    hours = ask_text("Opening hours (Arabic)", required=False)
    best_time = ask_text("Best time to visit (Arabic)", required=False)
    description = ask_text("Short description (Arabic)", required=False)

    place = {
        "id": next_id(places, city, category),
        "city": city,
        "category": category,
        "name_ar": name_ar,
        "name_en": name_en,
        "neighborhood_ar": neighborhood,
        "google_rating": round(rating, 1),
        "google_reviews_count": reviews,
        "rating_checked_on": date.today().isoformat(),
        "price_level": price,
        "family_friendly": family,
        "tags_ar": [t.strip() for t in tags_text.replace("،", ",").split(",") if t.strip()],
        "hours_ar": hours,
        "best_time_ar": best_time,
        "maps_url": url,
        "description_ar": description,
    }
    return place, picked


def main():
    places_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("data/places.json")
    candidates_path = places_path.parent / "candidates.md"

    data = json.loads(places_path.read_text(encoding="utf-8"))
    places = data["places"]

    print("=== Add a place ===  (Ctrl+C to quit)")
    while True:
        candidates = load_candidates(candidates_path)
        place, picked = ask_place(places, candidates)

        # Same rules as check_places.py, for this one place
        cp.errors.clear()
        cp.warnings.clear()
        cp.check_types(place["id"], place)
        cp.check_values(place["id"], place)
        print("\n--- Summary ---")
        print(json.dumps(place, ensure_ascii=False, indent=2))
        for line in cp.errors:
            print("  x", line)
        for line in cp.warnings:
            print("  !", line)

        if cp.errors:
            print("This place has errors and was NOT saved.")
        elif ask_yes_no("Save this place?"):
            places.append(place)
            places_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                                   encoding="utf-8")
            if picked:
                tick_candidate(candidates_path, picked[0])
            print(f"Saved as {place['id']}. Total places: {len(places)}")
        else:
            print("Not saved.")

        if not ask_yes_no("\nAdd another place?"):
            break
    print("Done. Run 'python check_places.py' to check the whole file.")


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print("\nStopped. Places saved before this point are kept.")
