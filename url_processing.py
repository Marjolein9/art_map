import pandas as pd
import requests
from bs4 import BeautifulSoup
from time import sleep

INPUT_CSV = "backend/data/country_external_links.csv"
OUTPUT_CSV = "backend/data/country_external_links3.csv"

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

NO_CONTENT_TEXT = "Sorry, we have no content on this part of the street yet"


def page_has_no_content(url):
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        h4 = soup.find(
            "h4",
            class_="w-100 text-center text-muted"
        )

        if h4 and NO_CONTENT_TEXT in h4.get_text(strip=True):
            return True

        return False

    except Exception as e:
        print(f"⚠️ Error checking {url}: {e}")
        return True  # treat failures as invalid


def main():
    df = pd.read_csv(INPUT_CSV)

    print(f"Loaded {len(df)} rows")

    for idx, row in df.iterrows():
        url = row.get("gapminder_url")

        if not isinstance(url, str) or not url.strip():
            continue

        print(f"Checking: {url}")

        if page_has_no_content(url):
            print("❌ No content — clearing URL")
            df.at[idx, "gapminder_url"] = ""
        else:
            print("✅ Valid")

        sleep(0.5)  # be polite to Gapminder

    df.to_csv(OUTPUT_CSV, index=False)

    print("\n✅ Done")
    print(f"Total rows preserved: {len(df)}")
    print(f"Saved to: {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
