import json
import time
from pathlib import Path

INPUT_FILE = "backend/data/m49-list.json"
OUTPUT_FILE = "backend/data/m49-list_short.json"



def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    countries_out = []

    for c in data.get("countries", []):
        region_code = c.get("region")
        subregion_code = c.get("subRegion")

        countries_out.append({
            "name": c.get("name"),
            "subregion number": subregion_code
        })

    output_data = {
        "lastUpdated": int(time.time() * 1000),
        "countries": countries_out
    }

    output_path = Path(OUTPUT_FILE)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"✅ Wrote {len(countries_out)} countries to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
