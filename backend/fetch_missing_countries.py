#!/usr/bin/env python3
"""
Multi-Museum Art Fetcher for Missing Countries

Searches museum APIs for artwork from countries listed in no_image.txt,
using both current and historical/colonial names.
Downloads up to 5 public domain images per country per museum.

Museums (no key required):
  - Metropolitan Museum of Art      free, always on
  - Art Institute of Chicago        free, always on
  - Cleveland Museum of Art         free, always on
  - Rijksmuseum Amsterdam           free, open Search API + OAI-PMH
  - Wikidata / Wikimedia Commons    free, global visual-art coverage
  - US National Archives (NARA)     free, great for territories & colonial history

Museums (optional API key — get free keys instantly):
  - Smithsonian Institution         SMITHSONIAN_KEY  api.si.edu
      → African Art, Asian Art (Freer/Sackler), Native American (NMAI)
  - Harvard Art Museums             HARVARD_KEY      harvardartmuseums.org/collections/api
      → Asia, Africa, pre-Columbian Americas
  - Europeana                       EUROPEANA_KEY    apis.europeana.eu
      → European colonial-era collections, French/Dutch/British empires

Usage:
  python3 backend/fetch_missing_countries.py
  SMITHSONIAN_KEY=x HARVARD_KEY=y EUROPEANA_KEY=z python3 backend/fetch_missing_countries.py
  python3 backend/fetch_missing_countries.py --countries KEN ZWE NAM HTI
"""

import os
import sys
import csv
import time
import logging
import argparse
import requests
from pathlib import Path
from PIL import Image
from io import BytesIO

# ── Configuration ──────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
M49_JSON   = SCRIPT_DIR / "data" / "m49-list_orig.json"
IMAGES_BASE = SCRIPT_DIR / "test_images"   # new downloads land here for review
IMAGES_PROD = SCRIPT_DIR / "images"         # production images — used to count existing
OUTPUT_CSV  = SCRIPT_DIR / "data" / "multi_museum_metadata.csv"

EXCLUDE_MUSEUMS = {"met", "nara"}

MAX_PER_MUSEUM    = 5
REQUEST_DELAY     = 0.5   # seconds between API calls
MAX_IMAGE_SIZE    = 1200  # max pixel dimension
JPEG_QUALITY      = 85
MUSEUM_TIMEOUT_S  = 120   # skip a museum after this many seconds

def _load_keys() -> dict[str, str]:
    """Read API keys from keys.txt (KEY=value format), with env vars taking priority."""
    keys: dict[str, str] = {}
    keys_file = SCRIPT_DIR / "keys.txt"
    if keys_file.exists():
        for line in keys_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                keys[k.strip()] = v.strip()
    # Env vars override file values
    for k in list(keys):
        keys[k] = os.getenv(k, keys[k])
    return keys

_KEYS = _load_keys()

RIJKSMUSEUM_KEY  = _KEYS.get("RIJKSMUSEUM_KEY", "")
EUROPEANA_KEY    = _KEYS.get("EUROPEANA_KEY", "")
SMITHSONIAN_KEY  = _KEYS.get("SMITHSONIAN_KEY", "")
HARVARD_KEY      = _KEYS.get("HARVARD_KEY", "")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Country aliases ────────────────────────────────────────────────────────────
# ISO3 → search terms (current name first, then historical / colonial / regional)
ALIASES: dict[str, list[str]] = {
    # Caribbean
    "CUB": ["Cuba"],
    "HTI": ["Haiti", "Saint-Domingue", "Hispaniola"],
    "JAM": ["Jamaica"],
    "BRB": ["Barbados"],
    "TTO": ["Trinidad", "Trinidad and Tobago"],
    "GRD": ["Grenada"],
    "BHS": ["Bahamas", "Bahama Islands"],
    "DMA": ["Dominica"],
    "KNA": ["Saint Kitts", "Saint Christopher"],
    "LCA": ["Saint Lucia"],
    "VCT": ["Saint Vincent"],
    "ATG": ["Antigua", "Barbuda"],

    # Caribbean territories
    "ABW": ["Aruba"],
    "CUW": ["Curaçao", "Curacao", "Netherlands Antilles"],
    "SXM": ["Sint Maarten"],
    "BES": ["Bonaire", "Sint Eustatius", "Saba"],
    "BLM": ["Saint Barthélemy", "Saint Barthelemy"],
    "MAF": ["Saint Martin"],
    "MTQ": ["Martinique"],
    "GLP": ["Guadeloupe"],
    "SPM": ["Saint Pierre and Miquelon"],
    "VGB": ["British Virgin Islands"],
    "VIR": ["United States Virgin Islands", "Danish West Indies"],
    "TCA": ["Turks and Caicos Islands"],
    "CYM": ["Cayman Islands"],
    "AIA": ["Anguilla"],

    # Americas
    "SUR": ["Suriname", "Surinam", "Dutch Guiana"],
    "GUF": ["French Guiana", "Guyane"],
    "NIC": ["Nicaragua"],

    # Pacific
    "WSM": ["Samoa", "Western Samoa", "German Samoa"],
    "VUT": ["Vanuatu", "New Hebrides"],
    "KIR": ["Kiribati", "Gilbert Islands"],
    "TUV": ["Tuvalu", "Ellice Islands"],
    "NRU": ["Nauru"],
    "PLW": ["Palau", "Belau"],
    "FSM": ["Micronesia", "Caroline Islands"],
    "MNP": ["Northern Mariana Islands", "Mariana Islands", "Saipan"],
    "GUM": ["Guam"],
    "ASM": ["American Samoa", "Tutuila"],
    "COK": ["Cook Islands"],
    "NIU": ["Niue"],
    "TKL": ["Tokelau", "Union Islands"],
    "PCN": ["Pitcairn Island"],
    "NFK": ["Norfolk Island"],
    "WLF": ["Wallis and Futuna", "Wallis", "Futuna"],
    "NCL": ["New Caledonia", "Nouvelle-Calédonie"],

    # Asia / Oceania
    "TWN": ["Taiwan", "Formosa"],
    "HKG": ["Hong Kong"],
    "MAC": ["Macao", "Macau"],
    "BRN": ["Brunei"],
    "MDV": ["Maldives", "Maldive Islands"],
    "PRK": ["Korea", "North Korea", "Chosen", "Chosun"],

    # Africa
    "ZWE": ["Zimbabwe", "Rhodesia", "Southern Rhodesia"],
    "NAM": ["Namibia", "South West Africa", "German South West Africa", "Deutsch-Südwestafrika"],
    "BWA": ["Botswana", "Bechuanaland"],
    "LSO": ["Lesotho", "Basutoland"],
    "SWZ": ["Eswatini", "Swaziland"],
    "KEN": ["Kenya", "British East Africa"],
    "ZMB": ["Zambia", "Northern Rhodesia"],
    "MOZ": ["Mozambique", "Portuguese East Africa"],
    "GMB": ["Gambia"],
    "GNB": ["Guinea-Bissau", "Portuguese Guinea"],
    "RWA": ["Rwanda", "Ruanda"],
    "BDI": ["Burundi", "Urundi"],
    "SEN": ["Senegal", "French West Africa"],
    "TGO": ["Togo", "Togoland"],
    "NER": ["Niger"],
    "TCD": ["Chad", "Tchad", "French Equatorial Africa"],
    "CAF": ["Central African Republic", "Ubangi-Shari"],
    "CPV": ["Cape Verde", "Cabo Verde"],
    "STP": ["São Tomé", "Sao Tome"],
    "COM": ["Comoros", "Comoro Islands"],
    "MUS": ["Mauritius"],
    "SYC": ["Seychelles"],
    "GIN": ["Guinea", "French Guinea"],
    "ERI": ["Eritrea", "Italian Eritrea"],
    "SOM": ["Somalia", "Somaliland", "Italian Somaliland"],
    "DJI": ["Djibouti", "French Somaliland"],
    "MRT": ["Mauritania"],
    "ESH": ["Western Sahara", "Spanish Sahara"],
    "LBY": ["Libya", "Italian Libya", "Tripolitania"],
    "MYT": ["Mayotte"],
    "REU": ["Réunion", "Reunion", "Bourbon Island"],

    # Southern Atlantic / sub-Antarctic
    "SGS": ["South Georgia"],
    "SHN": ["Saint Helena"],
    "FLK": ["Falkland Islands", "Malvinas"],
    "BVT": ["Bouvet Island"],

    # Indian Ocean
    "IOT": ["Chagos Islands", "British Indian Ocean Territory"],
    "CXR": ["Christmas Island"],
    "CCK": ["Cocos Islands", "Cocos Keeling Islands"],

    # Europe
    "ALA": ["Åland", "Aland Islands"],
    "AND": ["Andorra"],
    "MCO": ["Monaco"],
    "LIE": ["Liechtenstein"],
    "SMR": ["San Marino"],
    "VAT": ["Vatican", "Holy See", "Papal States"],
    "GIB": ["Gibraltar"],
    "IMN": ["Isle of Man"],
    "GGY": ["Guernsey"],
    "JEY": ["Jersey"],
    "FRO": ["Faroe Islands", "Faeroe Islands"],
    "GRL": ["Greenland", "Kalaallit Nunaat"],
    "SJM": ["Svalbard", "Spitsbergen"],
    "LUX": ["Luxembourg"],
    "ISL": ["Iceland"],

    # Eastern Europe / former Soviet
    "EST": ["Estonia"],
    "BLR": ["Belarus", "Byelorussia"],
    "ARM": ["Armenia"],
    "KAZ": ["Kazakhstan"],
    "KGZ": ["Kyrgyzstan", "Kirghizia"],

    # Middle East
    "BHR": ["Bahrain"],
    "KWT": ["Kuwait"],
    "QAT": ["Qatar"],
    "ARE": ["United Arab Emirates", "UAE", "Trucial States"],
    "ISR": ["Israel", "Palestine", "Holy Land"],

    # Special / Antarctic
    "ATA": ["Antarctica", "Antarctic"],
    "ATF": ["French Southern Territories", "Kerguelen"],
    "HMD": ["Heard Island"],
    "UMI": ["United States Minor Outlying Islands"],
}


# ── Image helpers ──────────────────────────────────────────────────────────────

def download_image(url: str, dest: Path) -> bool:
    """Download, resize, and save an image as JPEG. Returns True on success."""
    try:
        r = requests.get(url, timeout=10, headers={"User-Agent": "ArtMapBot/1.0"})
        if r.status_code != 200:
            return False
        img = Image.open(BytesIO(r.content))
        if img.mode == "RGBA":
            bg = Image.new("RGB", img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[3])
            img = bg
        elif img.mode != "RGB":
            img = img.convert("RGB")

        w, h = img.size
        if w > MAX_IMAGE_SIZE or h > MAX_IMAGE_SIZE:
            ratio = MAX_IMAGE_SIZE / max(w, h)
            img = img.resize((int(w * ratio), int(h * ratio)), Image.Resampling.LANCZOS)

        dest.parent.mkdir(parents=True, exist_ok=True)
        quality = JPEG_QUALITY
        img.save(dest, "JPEG", quality=quality, optimize=True)

        # Reduce quality if still over 1 MB
        while dest.stat().st_size > 1_048_576 and quality > 50:
            quality -= 5
            img.save(dest, "JPEG", quality=quality, optimize=True)

        return True
    except Exception as e:
        log.debug("Image download error: %s", e)
        return False


# ── Relevance check ───────────────────────────────────────────────────────────

def _contains(query: str, *fields: str) -> bool:
    """Return True if query appears (case-insensitive) in any of the given text fields."""
    q = query.lower()
    return any(q in (f or "").lower() for f in fields)


# ── Museum search functions ────────────────────────────────────────────────────

def search_met(query: str, iso3: str, already: int) -> list[dict]:
    """
    Metropolitan Museum of Art — public domain only.
    Checks that the query appears in country/culture/title/tags/geography fields
    to avoid returning unrelated popular works.
    https://metmuseum.github.io/
    """
    want = MAX_PER_MUSEUM - already
    if want <= 0:
        return []

    results = []
    try:
        r = requests.get(
            "https://collectionapi.metmuseum.org/public/collection/v1/search",
            params={"q": query, "hasImages": "true", "isPublicDomain": "true"},
            timeout=15,
        )
        if r.status_code != 200:
            return []
        ids = r.json().get("objectIDs") or []
    except Exception as e:
        log.debug("MET search error: %s", e)
        return []

    checked = 0
    for obj_id in ids:
        if len(results) >= want or checked >= want * 8:
            break
        checked += 1
        try:
            rd = requests.get(
                f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{obj_id}",
                timeout=15,
            )
            if rd.status_code != 200:
                continue
            d = rd.json()
            if not d.get("isPublicDomain") or not d.get("primaryImage"):
                continue

            # Only keep if query appears in geographic/cultural metadata
            tag_terms = " ".join(t.get("term", "") for t in (d.get("tags") or []))
            relevant = _contains(
                query,
                d.get("country", ""),
                d.get("culture", ""),
                d.get("artistNationality", ""),
                d.get("title", ""),
                d.get("geography", ""),
                d.get("region", ""),
                d.get("subregion", ""),
                d.get("locale", ""),
                d.get("geographyType", ""),
                tag_terms,
            )
            if not relevant:
                log.debug("    [MET] skip (not relevant): %s", d.get("title", obj_id))
                time.sleep(REQUEST_DELAY)
                continue

            img_path = IMAGES_BASE / iso3 / "met" / f"{obj_id}.jpg"
            if img_path.exists() or download_image(d["primaryImage"], img_path):
                results.append({
                    "museum": "met",
                    "source_id": str(obj_id),
                    "iso3": iso3,
                    "search_term": query,
                    "title": d.get("title", ""),
                    "artist": d.get("artistDisplayName", ""),
                    "date": d.get("objectDate", ""),
                    "culture": d.get("culture", ""),
                    "medium": d.get("medium", ""),
                    "source_url": d.get("objectURL", ""),
                    "image_url": d["primaryImage"],
                    "filepath": str(img_path),
                    "license": "public domain",
                })
                log.info("    [MET] %s", d.get("title", obj_id))
            time.sleep(REQUEST_DELAY)
        except Exception as e:
            log.debug("MET object error %s: %s", obj_id, e)

    return results


def search_aic(query: str, iso3: str, already: int) -> list[dict]:
    """
    Art Institute of Chicago — public domain only.
    Checks that query appears in place_of_origin or title to avoid
    returning unrelated popular works.
    https://api.artic.edu/docs/
    """
    want = MAX_PER_MUSEUM - already
    if want <= 0:
        return []

    IIIF = "https://www.artic.edu/iiif/2/{}/full/843,/0/default.jpg"
    results = []
    try:
        r = requests.get(
            "https://api.artic.edu/api/v1/artworks/search",
            params={
                "q": query,
                "fields": "id,title,image_id,place_of_origin,artist_display,is_public_domain,date_display",
                "query[term][is_public_domain]": "true",
                "limit": want * 6,
            },
            timeout=15,
        )
        if r.status_code != 200:
            return []
        items = r.json().get("data", [])
    except Exception as e:
        log.debug("AIC search error: %s", e)
        return []

    for item in items:
        if len(results) >= want:
            break
        if not item.get("is_public_domain") or not item.get("image_id"):
            continue

        # Only keep if query appears in place of origin or title
        relevant = _contains(
            query,
            item.get("place_of_origin", ""),
            item.get("title", ""),
            item.get("artist_display", ""),
        )
        if not relevant:
            log.debug("    [AIC] skip (not relevant): %s", item.get("title", ""))
            continue

        img_url = IIIF.format(item["image_id"])
        img_path = IMAGES_BASE / iso3 / "aic" / f"{item['id']}.jpg"
        if img_path.exists() or download_image(img_url, img_path):
            results.append({
                "museum": "aic",
                "source_id": str(item["id"]),
                "iso3": iso3,
                "search_term": query,
                "title": item.get("title", ""),
                "artist": item.get("artist_display", ""),
                "date": item.get("date_display", ""),
                "culture": item.get("place_of_origin", ""),
                "medium": "",
                "source_url": f"https://www.artic.edu/artworks/{item['id']}",
                "image_url": img_url,
                "filepath": str(img_path),
                "license": "public domain",
            })
            log.info("    [AIC] %s", item.get("title", item["id"]))
        time.sleep(REQUEST_DELAY)

    return results


def search_cleveland(query: str, iso3: str, already: int) -> list[dict]:
    """
    Cleveland Museum of Art Open Access — CC0 (public domain).
    Checks that query appears in culture/title/description.
    https://openaccess-api.clevelandart.org/
    """
    want = MAX_PER_MUSEUM - already
    if want <= 0:
        return []

    results = []
    try:
        r = requests.get(
            "https://openaccess-api.clevelandart.org/api/artworks/",
            params={"q": query, "has_image": 1, "cc0": 1, "limit": want * 6},
            timeout=15,
        )
        if r.status_code != 200:
            return []
        items = r.json().get("data", [])
    except Exception as e:
        log.debug("Cleveland search error: %s", e)
        return []

    for item in items:
        if len(results) >= want:
            break
        img_url = (item.get("images") or {}).get("web", {}).get("url", "")
        if not img_url:
            continue

        cultures = " ".join(item.get("culture") or [])
        relevant = _contains(
            query,
            item.get("title", ""),
            cultures,
            item.get("description", ""),
            item.get("findspot", ""),
        )
        if not relevant:
            log.debug("    [Cleveland] skip (not relevant): %s", item.get("title", ""))
            continue

        obj_id = str(item.get("id", ""))
        img_path = IMAGES_BASE / iso3 / "cleveland" / f"{obj_id}.jpg"
        if img_path.exists() or download_image(img_url, img_path):
            results.append({
                "museum": "cleveland",
                "source_id": obj_id,
                "iso3": iso3,
                "search_term": query,
                "title": item.get("title", ""),
                "artist": (item.get("creators") or [{"description": ""}])[0].get("description", ""),
                "date": item.get("creation_date", ""),
                "culture": cultures,
                "medium": item.get("technique", ""),
                "source_url": item.get("url", ""),
                "image_url": img_url,
                "filepath": str(img_path),
                "license": "CC0",
            })
            log.info("    [Cleveland] %s", item.get("title", obj_id))
        time.sleep(REQUEST_DELAY)

    return results


def _rijks_get_record(oai_id: str) -> dict | None:
    """
    Resolve a Rijksmuseum Linked Art ID to Dublin Core metadata via OAI-PMH.
    Returns dict with keys: title, creator, date, relation (image URL), rights, identifier.
    No API key needed.
    """
    try:
        r = requests.get(
            "https://data.rijksmuseum.nl/oai",
            params={"verb": "GetRecord", "metadataPrefix": "oai_dc", "identifier": oai_id},
            timeout=15,
        )
        if r.status_code != 200:
            return None
        from xml.etree import ElementTree as ET
        root = ET.fromstring(r.text)
        ns = {
            "oai": "http://www.openarchives.org/OAI/2.0/",
            "oai_dc": "http://www.openarchives.org/OAI/2.0/oai_dc/",
        }
        meta = root.find(".//oai_dc:dc", ns)
        if meta is None:
            return None
        dc: dict[str, list[str]] = {}
        for elem in meta:
            tag = elem.tag.split("}")[-1]
            dc.setdefault(tag, []).append(elem.text or "")
        return dc
    except Exception as e:
        log.debug("Rijksmuseum OAI-PMH error %s: %s", oai_id, e)
        return None


def search_rijksmuseum(query: str, iso3: str, already: int) -> list[dict]:
    """
    Rijksmuseum Amsterdam — no API key needed.
    Uses the open Search API (data.rijksmuseum.nl/search/collection) to find
    objects by title or description, then fetches image URLs via OAI-PMH GetRecord.
    Excellent for Dutch colonial art (Java, Suriname, Cape Colony, etc.).
    """
    want = MAX_PER_MUSEUM - already
    if want <= 0:
        return []

    results = []
    # Search by description and title separately, combine unique IDs
    candidate_ids: list[str] = []
    for field in ("description", "title"):
        try:
            r = requests.get(
                "https://data.rijksmuseum.nl/search/collection",
                params={field: query, "imageAvailable": "true"},
                timeout=15,
            )
            if r.status_code == 200:
                items = r.json().get("orderedItems", [])
                for item in items:
                    oid = item.get("id", "")
                    if oid and oid not in candidate_ids:
                        candidate_ids.append(oid)
        except Exception as e:
            log.debug("Rijksmuseum search (%s) error: %s", field, e)
        time.sleep(REQUEST_DELAY)
        if len(candidate_ids) >= want * 4:
            break

    PUBLIC_DOMAIN_RIGHTS = {
        "https://creativecommons.org/publicdomain/mark/1.0/",
        "https://creativecommons.org/publicdomain/zero/1.0/",
        "http://creativecommons.org/publicdomain/mark/1.0/",
        "http://creativecommons.org/publicdomain/zero/1.0/",
    }

    for oai_id in candidate_ids:
        if len(results) >= want:
            break
        dc = _rijks_get_record(oai_id)
        if not dc:
            continue

        img_url = dc.get("relation", [""])[0]
        rights = dc.get("rights", [""])[0]
        if not img_url or rights not in PUBLIC_DOMAIN_RIGHTS:
            continue

        # Verify the query appears in the DC metadata
        relevant = _contains(
            query,
            dc.get("title", [""])[0],
            " ".join(dc.get("description", [])),
            dc.get("coverage", [""])[0],
            dc.get("subject", [""])[0],
        )
        if not relevant:
            log.debug("    [Rijksmuseum] skip (not relevant): %s", dc.get("title", [""])[0])
            continue

        obj_num = dc.get("identifier", [""])[0]
        safe_id = obj_num.replace("/", "_").replace(" ", "_")
        img_path = IMAGES_BASE / iso3 / "rijksmuseum" / f"{safe_id}.jpg"
        if img_path.exists() or download_image(img_url, img_path):
            title = dc.get("title", [""])[0]
            results.append({
                "museum": "rijksmuseum",
                "source_id": obj_num,
                "iso3": iso3,
                "search_term": query,
                "title": title,
                "artist": dc.get("creator", [""])[0],
                "date": dc.get("date", [""])[0],
                "culture": dc.get("coverage", [""])[0],
                "medium": dc.get("format", [""])[0],
                "source_url": f"https://www.rijksmuseum.nl/en/collection/{obj_num}",
                "image_url": img_url,
                "filepath": str(img_path),
                "license": "public domain",
            })
            log.info("    [Rijksmuseum] %s", title or obj_num)
        time.sleep(REQUEST_DELAY)

    return results


def search_europeana(query: str, iso3: str, already: int) -> list[dict]:
    """
    Europeana — aggregator of European cultural heritage.
    reusability=open returns public domain / openly licensed items.
    Requires EUROPEANA_KEY. Free registration at apis.europeana.eu.
    """
    if not EUROPEANA_KEY:
        return []
    want = MAX_PER_MUSEUM - already
    if want <= 0:
        return []

    results = []
    try:
        r = requests.get(
            "https://api.europeana.eu/record/v2/search.json",
            params={
                "wskey": EUROPEANA_KEY,
                "query": query,
                "media": "true",
                "reusability": "open",
                "rows": want * 2,
                "profile": "rich",
            },
            timeout=15,
        )
        if r.status_code != 200:
            return []
        items = r.json().get("items", [])
    except Exception as e:
        log.debug("Europeana search error: %s", e)
        return []

    for item in items:
        if len(results) >= want:
            break
        img_url = ""
        if item.get("edmIsShownBy"):
            img_url = item["edmIsShownBy"][0] if isinstance(item["edmIsShownBy"], list) else item["edmIsShownBy"]
        if not img_url:
            continue

        obj_id = item.get("id", "").strip("/").replace("/", "_")
        img_path = IMAGES_BASE / iso3 / "europeana" / f"{obj_id}.jpg"
        if img_path.exists() or download_image(img_url, img_path):
            title = ""
            if item.get("title"):
                title = item["title"][0] if isinstance(item["title"], list) else item["title"]
            results.append({
                "museum": "europeana",
                "source_id": item.get("id", ""),
                "iso3": iso3,
                "search_term": query,
                "title": title,
                "artist": "",
                "date": item.get("year", [""])[0] if item.get("year") else "",
                "culture": "",
                "medium": "",
                "source_url": item.get("guid", ""),
                "image_url": img_url,
                "filepath": str(img_path),
                "license": "open",
            })
            log.info("    [Europeana] %s", title or obj_id)
        time.sleep(REQUEST_DELAY)

    return results


def search_wikidata(query: str, iso3: str, already: int) -> list[dict]:
    """
    Wikidata + Wikimedia Commons — no API key needed. Global coverage.
    Finds visual artworks (paintings, sculptures, drawings, prints) where the
    country-of-origin, location, or artist nationality matches the query.
    Image URLs come directly from Wikimedia Commons FilePath redirects.
    """
    want = MAX_PER_MUSEUM - already
    if want <= 0:
        return []

    # Visual art types: painting, sculpture, drawing, print, miniature, visual artwork
    SPARQL = """
SELECT DISTINCT ?item ?itemLabel ?image ?creatorLabel ?inceptionLabel WHERE {{
  VALUES ?type {{ wd:Q3305213 wd:Q860861 wd:Q93184 wd:Q219423 wd:Q207707 wd:Q4502142 wd:Q179700 }}
  ?item wdt:P18 ?image ;
        wdt:P31 ?type .
  {{
    ?item wdt:P495 ?country .
    ?country rdfs:label "{q}"@en .
  }} UNION {{
    ?item wdt:P276 ?loc .
    ?loc rdfs:label "{q}"@en .
  }} UNION {{
    ?item wdt:P170 ?creator .
    ?creator wdt:P27 ?ctry .
    ?ctry rdfs:label "{q}"@en .
  }}
  OPTIONAL {{ ?item wdt:P170 ?creator . }}
  OPTIONAL {{ ?item wdt:P571 ?inception . }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en" . }}
}}
LIMIT {limit}
""".format(q=query.replace('"', '\\"'), limit=want * 3)

    results = []
    try:
        r = requests.get(
            "https://query.wikidata.org/sparql",
            params={"query": SPARQL, "format": "json"},
            headers={
                "Accept": "application/sparql-results+json",
                "User-Agent": "ArtMapBot/1.0 (art map research tool)",
            },
            timeout=30,
        )
        if r.status_code != 200:
            log.debug("Wikidata status %s", r.status_code)
            return []
        bindings = r.json()["results"]["bindings"]
    except Exception as e:
        log.debug("Wikidata SPARQL error: %s", e)
        return []

    seen_images: set[str] = set()
    for row in bindings:
        if len(results) >= want:
            break
        img_url = row.get("image", {}).get("value", "")
        if not img_url or img_url in seen_images:
            continue
        seen_images.add(img_url)

        # Commons FilePath URL → direct download
        if "Special:FilePath" not in img_url:
            continue

        title = row.get("itemLabel", {}).get("value", "")
        item_id = row.get("item", {}).get("value", "").rsplit("/", 1)[-1]
        inception = row.get("inceptionLabel", {}).get("value", "")
        creator = row.get("creatorLabel", {}).get("value", "")

        safe_id = item_id.replace("/", "_")
        img_path = IMAGES_BASE / iso3 / "wikidata" / f"{safe_id}.jpg"
        if img_path.exists() or download_image(img_url, img_path):
            results.append({
                "museum": "wikidata",
                "source_id": item_id,
                "iso3": iso3,
                "search_term": query,
                "title": title,
                "artist": creator,
                "date": inception,
                "culture": query,
                "medium": "",
                "source_url": f"https://www.wikidata.org/wiki/{item_id}",
                "image_url": img_url,
                "filepath": str(img_path),
                "license": "public domain (Wikimedia Commons)",
            })
            log.info("    [Wikidata] %s", title or item_id)
        time.sleep(REQUEST_DELAY)

    return results


def search_smithsonian(query: str, iso3: str, already: int) -> list[dict]:
    """
    Smithsonian Institution Open Access — CC0 only.
    Covers: National Museum of African Art, Freer/Sackler (Asian Art),
    National Museum of the American Indian, and more.
    Free key at https://api.si.edu  (instant registration, set SMITHSONIAN_KEY).
    """
    if not SMITHSONIAN_KEY:
        return []
    want = MAX_PER_MUSEUM - already
    if want <= 0:
        return []

    results = []
    try:
        r = requests.get(
            "https://api.si.edu/openaccess/api/v1.0/search",
            params={
                "q": f'"{query}" AND media.usage.access:CC0',
                "api_key": SMITHSONIAN_KEY,
                "rows": want * 4,
                "online_visual_material": "true",
            },
            timeout=15,
        )
        if r.status_code != 200:
            log.debug("Smithsonian status %s", r.status_code)
            return []
        rows = r.json().get("response", {}).get("rows", [])
    except Exception as e:
        log.debug("Smithsonian search error: %s", e)
        return []

    for row in rows:
        if len(results) >= want:
            break

        content = row.get("content", {})
        dnr = content.get("descriptiveNonRepeating", {})
        freetext = content.get("freetext", {})

        # Find a CC0 image
        media_list = dnr.get("online_media", {}).get("media", [])
        img_url = ""
        for m in media_list:
            if m.get("type") == "Images" and m.get("usage", {}).get("access") == "CC0":
                img_url = m.get("content", "")
                break
        if not img_url:
            continue

        # Relevance: query must appear in place, title, or notes
        places = " ".join(p.get("content", "") for p in freetext.get("place", []))
        notes = " ".join(n.get("content", "") for n in freetext.get("notes", []))
        title_text = dnr.get("title", {}).get("content", "") or row.get("title", "")
        if not _contains(query, places, title_text, notes):
            log.debug("    [Smithsonian] skip (not relevant): %s", title_text[:60])
            continue

        obj_id = row.get("id", "").replace(":", "_").replace("/", "_")
        img_path = IMAGES_BASE / iso3 / "smithsonian" / f"{obj_id}.jpg"
        if img_path.exists() or download_image(img_url, img_path):
            names = freetext.get("name", [])
            artist = names[0].get("content", "") if names else ""
            dates = freetext.get("date", [])
            date = dates[0].get("content", "") if dates else ""
            results.append({
                "museum": "smithsonian",
                "source_id": row.get("id", ""),
                "iso3": iso3,
                "search_term": query,
                "title": title_text,
                "artist": artist,
                "date": date,
                "culture": places,
                "medium": "",
                "source_url": dnr.get("record_link", ""),
                "image_url": img_url,
                "filepath": str(img_path),
                "license": "CC0",
            })
            log.info("    [Smithsonian] %s", title_text[:60] or obj_id)
        time.sleep(REQUEST_DELAY)

    return results


def search_harvard(query: str, iso3: str, already: int) -> list[dict]:
    """
    Harvard Art Museums — excellent for Asian, African, and pre-Columbian Americas.
    Free key at https://harvardartmuseums.org/collections/api  (set HARVARD_KEY).
    Only includes works with imagepermissionlevel=0 (open access).
    """
    if not HARVARD_KEY:
        return []
    want = MAX_PER_MUSEUM - already
    if want <= 0:
        return []

    PUBLIC_DOMAIN_PHRASES = {
        "no known copyright restrictions",
        "public domain",
        "cc0",
        "creative commons zero",
    }

    results = []
    try:
        r = requests.get(
            "https://api.harvardartmuseums.org/object",
            params={
                "q": query,
                "apikey": HARVARD_KEY,
                "hasimage": 1,
                "imagepermissionlevel": 0,
                "sort": "rank",
                "size": want * 4,
            },
            timeout=15,
        )
        if r.status_code != 200:
            log.debug("Harvard status %s", r.status_code)
            return []
        records = r.json().get("records", [])
    except Exception as e:
        log.debug("Harvard search error: %s", e)
        return []

    for rec in records:
        if len(results) >= want:
            break

        img_url = rec.get("primaryimageurl", "")
        if not img_url:
            continue

        # Public domain check
        copyright_text = (rec.get("copyright") or "").lower()
        perm = rec.get("imagepermissionlevel", 99)
        is_pd = perm == 0 and any(phrase in copyright_text for phrase in PUBLIC_DOMAIN_PHRASES)
        if not is_pd:
            # Also accept if copyright is blank/none with open permission
            is_pd = perm == 0 and not copyright_text
        if not is_pd:
            continue

        # Relevance check
        culture = rec.get("culture", "")
        places = " ".join(p.get("displayname", "") for p in (rec.get("places") or []))
        people = " ".join(p.get("displayname", "") for p in (rec.get("people") or []))
        title = rec.get("title", "")
        if not _contains(query, culture, places, people, title):
            log.debug("    [Harvard] skip (not relevant): %s", title[:60])
            continue

        obj_id = str(rec.get("id", ""))
        img_path = IMAGES_BASE / iso3 / "harvard" / f"{obj_id}.jpg"
        if img_path.exists() or download_image(img_url, img_path):
            artist_list = rec.get("people") or []
            artist = next((p.get("name", "") for p in artist_list if p.get("role") == "Artist"), "")
            results.append({
                "museum": "harvard",
                "source_id": obj_id,
                "iso3": iso3,
                "search_term": query,
                "title": title,
                "artist": artist,
                "date": rec.get("dated", ""),
                "culture": culture or places,
                "medium": rec.get("technique", ""),
                "source_url": rec.get("url", ""),
                "image_url": img_url,
                "filepath": str(img_path),
                "license": "public domain",
            })
            log.info("    [Harvard] %s", title[:60] or obj_id)
        time.sleep(REQUEST_DELAY)

    return results


def search_nara(query: str, iso3: str, already: int) -> list[dict]:
    """
    US National Archives (catalog.archives.gov) — no API key needed.
    US government records are public domain. Great for territories, colonial
    histories, Pacific islands, Caribbean, and anywhere the US had a presence.
    https://catalog.archives.gov/
    """
    want = MAX_PER_MUSEUM - already
    if want <= 0:
        return []

    results = []
    try:
        r = requests.get(
            "https://catalog.archives.gov/proxy/records/search",
            params={"q": query, "searchType": "advanced", "rows": want * 6},
            headers={"Accept": "application/json"},
            timeout=15,
        )
        if r.status_code != 200:
            log.debug("NARA status %s", r.status_code)
            return []
        hits = r.json()["body"]["hits"]["hits"]
    except Exception as e:
        log.debug("NARA search error: %s", e)
        return []

    for hit in hits:
        if len(results) >= want:
            break
        rec = hit.get("_source", {}).get("record", {})

        # Must be unrestricted
        if rec.get("useRestriction", {}).get("status") != "Unrestricted":
            continue

        # Must have at least one image
        images = [
            obj for obj in rec.get("digitalObjects", [])
            if "Image" in obj.get("objectType", "")
            and obj.get("objectUrl", "")
        ]
        if not images:
            continue

        title = rec.get("title", "")
        scope = str(rec.get("scopeAndContentNote", "") or "")
        if not _contains(query, title, scope):
            log.debug("    [NARA] skip (not relevant): %s", title[:60])
            continue

        img_url = images[0]["objectUrl"]
        na_id = str(rec.get("naId", hit["_id"]))
        img_path = IMAGES_BASE / iso3 / "nara" / f"{na_id}.jpg"
        if img_path.exists() or download_image(img_url, img_path):
            results.append({
                "museum": "nara",
                "source_id": na_id,
                "iso3": iso3,
                "search_term": query,
                "title": title,
                "artist": "",
                "date": "",
                "culture": query,
                "medium": "photograph / archival",
                "source_url": f"https://catalog.archives.gov/id/{na_id}",
                "image_url": img_url,
                "filepath": str(img_path),
                "license": "US government work (public domain)",
            })
            log.info("    [NARA] %s", title[:60] or na_id)
        time.sleep(REQUEST_DELAY)

    return results


# ── Orchestration ──────────────────────────────────────────────────────────────

MUSEUMS = [
    ("aic",          search_aic),
    ("cleveland",    search_cleveland),
    ("rijksmuseum",  search_rijksmuseum),
    ("wikidata",     search_wikidata),
    ("smithsonian",  search_smithsonian),
    ("harvard",      search_harvard),
    ("europeana",    search_europeana),
]


def _count_prod_images(iso3: str) -> int:
    """Count images in the production folder for a country, excluding met/nara."""
    country_dir = IMAGES_PROD / iso3
    if not country_dir.exists():
        return 0
    total = 0
    for museum_dir in country_dir.iterdir():
        if museum_dir.is_dir() and museum_dir.name not in EXCLUDE_MUSEUMS:
            total += sum(1 for f in museum_dir.iterdir() if f.is_file())
    return total


def load_countries() -> list[tuple[str, str]]:
    """Return countries (from production images dir) with 0 or 1 images, using common_name from m49."""
    import json

    with open(M49_JSON, encoding="utf-8") as f:
        m49 = json.load(f)
    iso_to_name = {
        c["iso3"]: c.get("common_name", c["name"])
        for c in m49["countries"]
        if "iso3" in c
    }

    results: list[tuple[str, str, int]] = []
    if IMAGES_PROD.exists():
        for country_dir in IMAGES_PROD.iterdir():
            if not country_dir.is_dir():
                continue
            iso3 = country_dir.name
            if iso3 not in iso_to_name:
                continue
            count = _count_prod_images(iso3)
            if count <= 1:
                results.append((iso3, iso_to_name[iso3], count))

    results.sort(key=lambda x: (x[2], x[1]))
    return [(iso3, name) for iso3, name, _ in results]


def count_existing(iso3: str, museum: str) -> int:
    """Count already-downloaded images for this country+museum pair."""
    img_dir = IMAGES_BASE / iso3 / museum
    if not img_dir.exists():
        return 0
    return len(list(img_dir.glob("*.jpg")))


def fetch_country(iso3: str, name: str, existing_rows: list[dict]) -> list[dict]:
    """Run all museums for one country, return new metadata rows."""
    search_terms = ALIASES.get(iso3, [name])
    log.info("=== %s (%s) — search terms: %s", name, iso3, search_terms)

    new_rows: list[dict] = []

    for museum_id, search_fn in MUSEUMS:
        already = count_existing(iso3, museum_id)
        if already >= MAX_PER_MUSEUM:
            log.info("  [%s] already has %d images, skipping", museum_id, already)
            continue

        found = 0
        museum_start = time.monotonic()
        for term in search_terms:
            if time.monotonic() - museum_start > MUSEUM_TIMEOUT_S:
                log.warning("  [%s] timeout after %ds, moving on", museum_id, MUSEUM_TIMEOUT_S)
                break
            still_need = MAX_PER_MUSEUM - already - found
            if still_need <= 0:
                break
            log.info("  [%s] searching '%s' (need %d more)", museum_id, term, still_need)
            rows = search_fn(term, iso3, already + found)
            new_rows.extend(rows)
            found += len(rows)
            time.sleep(REQUEST_DELAY)

        log.info("  [%s] total new: %d", museum_id, found)

    return new_rows


def main():
    parser = argparse.ArgumentParser(description="Fetch art for countries missing images.")
    parser.add_argument(
        "--countries", nargs="*", metavar="ISO3",
        help="Only process these ISO3 codes (default: all from no_image.txt)",
    )
    args = parser.parse_args()

    # Print active museums
    log.info("Active museums:")
    log.info("  Art Inst. Chicago   (no key)")
    log.info("  Cleveland Museum    (no key)")
    log.info("  Rijksmuseum         (no key)")
    log.info("  Wikidata/Commons    (no key)")
    log.info("  Smithsonian         (key: %s)", "SET" if SMITHSONIAN_KEY else "NOT SET — skipping")
    log.info("  Harvard Art Museums (key: %s)", "SET" if HARVARD_KEY else "NOT SET — skipping")
    log.info("  Europeana           (key: %s)", "SET" if EUROPEANA_KEY else "NOT SET — skipping")

    countries = load_countries()
    log.info("Found %d countries with 0–1 images (excluding met/nara)", len(countries))

    if args.countries:
        wanted = {c.upper() for c in args.countries}
        countries = [(iso3, name) for iso3, name in countries if iso3 in wanted]
        log.info("Filtered to %d countries: %s", len(countries), wanted)

    # Load existing CSV if present
    existing_rows: list[dict] = []
    all_rows: list[dict] = []
    fieldnames = [
        "museum", "source_id", "iso3", "search_term", "title", "artist",
        "date", "culture", "medium", "source_url", "image_url", "filepath", "license",
    ]
    if OUTPUT_CSV.exists():
        with open(OUTPUT_CSV, encoding="utf-8") as f:
            existing_rows = list(csv.DictReader(f))
        all_rows = list(existing_rows)
        log.info("Loaded %d existing metadata rows from CSV", len(existing_rows))

    # Process each country
    for i, (iso3, name) in enumerate(countries, 1):
        log.info("\n[%d/%d]", i, len(countries))
        new_rows = fetch_country(iso3, name, existing_rows)
        all_rows.extend(new_rows)

        # Write CSV after each country so progress is saved
        OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
        with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_rows)

    log.info("\nDone. Total rows in CSV: %d", len(all_rows))
    log.info("Metadata: %s", OUTPUT_CSV)
    log.info("Images:   %s", IMAGES_BASE)


if __name__ == "__main__":
    main()
