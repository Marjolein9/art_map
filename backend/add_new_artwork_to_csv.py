"""
Append rows from new_public_domain_images - Sheet1.csv into data/artwork_final.csv,
mapping columns and deduplicating by (title, artist_iso3).

Also backfills artwork_date, tags (medium), and more_info (license) for rows that
were added by an older version of this script and are missing those values.

After running this script, run backend/init_database_postgres.py to load images
into the database. init_database_postgres.py will download each image from its
HTTP image_url and store it under images/{artist_iso3}/children_artwork/.

Usage:
    cd backend
    python add_new_artwork_to_csv.py [--dry-run]
"""

import csv
import os
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
NEW_CSV = os.path.join(SCRIPT_DIR, "new_public_domain_images - Sheet1.csv")
ARTWORK_CSV = os.path.join(SCRIPT_DIR, "data", "artwork_final.csv")

DRY_RUN = "--dry-run" in sys.argv


def _clean_date(date_str):
    """Convert ISO timestamps like 1850-01-01T00:00:00Z to just the year."""
    return re.sub(r'^(\d{4})-\d{2}-\d{2}T.*$', r'\1', date_str)


def load_new_csv():
    """Return a dict keyed by (title_lower, iso3_upper) → new CSV row."""
    lookup = {}
    with open(NEW_CSV, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            title = r["title"].strip()
            iso3  = r["iso3"].strip().upper()
            if title and iso3:
                lookup[(title.lower(), iso3)] = r
    return lookup


def make_artwork_row(fieldnames, r):
    """Map a new CSV DictReader row to a full artwork_final.csv row dict."""
    artist  = r["artist"].strip()
    culture = r["culture"].strip()

    artist_name  = artist or culture
    nationality  = ""

    values = {
        "Artist Nationality":  nationality,
        "artist_iso3":         r["iso3"].strip(),
        "Country of Subject: ":r["search_term"].strip(),
        "iso3":                r["iso3"].strip(),
        "artist_name":         artist_name,
        "Author WikiLink":     "",
        "title":               r["title"].strip(),
        "Keep":                "keep",
        "Nudity":              "",
        "image_url":           r["image_url"].strip(),
        "work_url":            r["source_url"].strip(),
        "Location Reason":     "",
        "Author Background":   "",
        "birth_date":          "",
        "death_date":          "",
        "birth_place":         "",
        "source":              r["museum"].strip(),
        "tags":                r["medium"].strip(),
        "More info":           r["license"].strip(),
        "is_local":            "FALSE",
        "filepath":            "",
        "artwork_date":        _clean_date(r["date"].strip()),
    }
    return {k: values.get(k, "") for k in fieldnames}


def main():
    new_lookup = load_new_csv()

    # Read entire artwork_final.csv into memory
    with open(ARTWORK_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    existing_keys = set()
    for row in rows:
        title = row.get("title", "").strip().lower()
        iso3  = row.get("artist_iso3", "").strip().upper()
        if title and iso3:
            existing_keys.add((title, iso3))

    added = backfilled = skipped_dup = skipped_invalid = 0
    new_rows = []

    # --- Pass 1: backfill missing fields in existing rows ---
    for row in rows:
        title = row.get("title", "").strip().lower()
        iso3  = row.get("artist_iso3", "").strip().upper()
        key   = (title, iso3)
        if key not in new_lookup:
            continue
        src = new_lookup[key]
        changed = False
        existing_date = row.get("artwork_date", "").strip()
        new_date = _clean_date(src["date"].strip())
        if new_date and existing_date != new_date:
            row["artwork_date"] = new_date
            changed = True
        if not row.get("tags", "").strip() and src["medium"].strip():
            row["tags"] = src["medium"].strip()
            changed = True
        if not row.get("More info", "").strip() and src["license"].strip():
            row["More info"] = src["license"].strip()
            changed = True
        if changed:
            backfilled += 1

    # --- Pass 2: add completely new rows ---
    for key, src in new_lookup.items():
        title = src["title"].strip()
        iso3  = src["iso3"].strip().upper()

        if not title or not iso3:
            skipped_invalid += 1
            continue

        if key in existing_keys:
            skipped_dup += 1
            continue

        new_rows.append(make_artwork_row(fieldnames, src))
        existing_keys.add(key)
        added += 1

    if DRY_RUN:
        print(f"DRY RUN — would backfill {backfilled} rows, add {added} new rows")
        print(f"  Skipped {skipped_dup} duplicates, {skipped_invalid} invalid")
        for row in new_rows[:5]:
            print(f"  NEW [{row['artist_iso3']}] {row['title'][:50]} | date={row['artwork_date']} | medium={row['tags']}")
        return

    # Write everything back
    all_rows = rows + new_rows
    with open(ARTWORK_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(all_rows)

    print(f"Backfilled {backfilled} rows | Added {added} new rows | Skipped {skipped_dup} duplicates")
    print("Run backend/init_database_postgres.py to load into the database.")


if __name__ == "__main__":
    main()
