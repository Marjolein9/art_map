import pandas as pd
import requests
import urllib.parse
from time import sleep

INPUT_CSV = "backend/data/exports/countries.csv"
OUTPUT_CSV = "countries_wikipedia_links.csv"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; GeographyBot/1.0)"
}

def make_wikipedia_url(name):
    encoded = urllib.parse.quote(name.replace(" ", "_"))
    return f"https://en.wikipedia.org/wiki/{encoded}"

def check_url(url):
    try:
        r = requests.get(url, headers=HEADERS, allow_redirects=True, timeout=10)
        return r.status_code, r.url
    except Exception:
        return "ERROR", ""

df = pd.read_csv(INPUT_CSV)

rows = []

for _, row in df.iterrows():
    iso3 = row["iso3"]
    name = row["common_name"]

    wiki_url = make_wikipedia_url(name)
    status, final_url = check_url(wiki_url)

    rows.append({
        "iso3": iso3,
        "wikipedia_url": wiki_url,
        "http_status": status,
        "final_url": final_url
    })

    sleep(0.5)  # polite to Wikipedia

out_df = pd.DataFrame(rows)
out_df.to_csv(OUTPUT_CSV, index=False)

print(f"Saved {len(out_df)} rows to {OUTPUT_CSV}")
