import json
import time
from pathlib import Path


INPUT_FILE = "backend/data/m49-list.json"
OUTPUT_FILE = "backend/data/m49-list_corrected.json"

# Correct UN M49 region/subregion numbers
# Region codes: 2=Africa, 5=Americas, 142=Asia, 150=Europe, 9=Oceania, 419=Other/Caribbean?
FIXED_SUBREGIONS = {
    # Africa
    "Angola": {"region": 2, "subRegion": 17},  # Middle Africa
    "Benin": {"region": 2, "subRegion": 11},   # Western Africa
    "Botswana": {"region": 2, "subRegion": 18}, # Southern Africa
    "Burkina Faso": {"region": 2, "subRegion": 11},
    "Burundi": {"region": 2, "subRegion": 14},
    "Cabo Verde": {"region": 2, "subRegion": 11},
    "Cameroon": {"region": 2, "subRegion": 17},
    "Central African Republic": {"region": 2, "subRegion": 17},
    "Chad": {"region": 2, "subRegion": 17},
    "Comoros": {"region": 2, "subRegion": 14},
    "Congo": {"region": 2, "subRegion": 17},
    "Democratic Republic of the Congo": {"region": 2, "subRegion": 17},
    "Côte d’Ivoire": {"region": 2, "subRegion": 11},
    "Djibouti": {"region": 2, "subRegion": 14},
    "Equatorial Guinea": {"region": 2, "subRegion": 17},
    "Eritrea": {"region": 2, "subRegion": 14},
    "Eswatini": {"region": 2, "subRegion": 18},
    "Ethiopia": {"region": 2, "subRegion": 14},
    "Gabon": {"region": 2, "subRegion": 17},
    "Gambia": {"region": 2, "subRegion": 11},
    "Ghana": {"region": 2, "subRegion": 11},
    "Guinea": {"region": 2, "subRegion": 11},
    "Guinea-Bissau": {"region": 2, "subRegion": 11},
    "Kenya": {"region": 2, "subRegion": 14},
    "Lesotho": {"region": 2, "subRegion": 18},
    "Liberia": {"region": 2, "subRegion": 11},
    "Madagascar": {"region": 2, "subRegion": 14},
    "Malawi": {"region": 2, "subRegion": 14},
    "Mali": {"region": 2, "subRegion": 11},
    "Mauritania": {"region": 2, "subRegion": 11},
    "Mauritius": {"region": 2, "subRegion": 14},
    "Mayotte": {"region": 2, "subRegion": 14},
    "Morocco": {"region": 2, "subRegion": 15},
    "Mozambique": {"region": 2, "subRegion": 14},
    "Namibia": {"region": 2, "subRegion": 18},
    "Niger": {"region": 2, "subRegion": 11},
    "Nigeria": {"region": 2, "subRegion": 11},
    "Rwanda": {"region": 2, "subRegion": 14},
    "Sao Tome and Principe": {"region": 2, "subRegion": 17},
    "Senegal": {"region": 2, "subRegion": 11},
    "Seychelles": {"region": 2, "subRegion": 14},
    "Sierra Leone": {"region": 2, "subRegion": 11},
    "Somalia": {"region": 2, "subRegion": 14},
    "South Africa": {"region": 2, "subRegion": 18},
    "South Sudan": {"region": 2, "subRegion": 14},
    "Togo": {"region": 2, "subRegion": 11},
    "Uganda": {"region": 2, "subRegion": 14},
    "United Republic of Tanzania": {"region": 2, "subRegion": 14},
    "Zambia": {"region": 2, "subRegion": 14},
    "Zimbabwe": {"region": 2, "subRegion": 14},

    # Asia
    "Afghanistan": {"region": 142, "subRegion": 34},  # Southern Asia
    "Armenia": {"region": 142, "subRegion": 145},     # Western Asia
    "Azerbaijan": {"region": 142, "subRegion": 145},
    "Bahrain": {"region": 142, "subRegion": 145},
    "Bangladesh": {"region": 142, "subRegion": 34},
    "Bhutan": {"region": 142, "subRegion": 34},
    "Brunei Darussalam": {"region": 142, "subRegion": 35},
    "Cambodia": {"region": 142, "subRegion": 35},
    "China": {"region": 142, "subRegion": 30},
    "China, Hong Kong Special Administrative Region": {"region": 142, "subRegion": 30},
    "China, Macao Special Administrative Region": {"region": 142, "subRegion": 30},
    "India": {"region": 142, "subRegion": 34},
    "Indonesia": {"region": 142, "subRegion": 35},
    "Iran (Islamic Republic of)": {"region": 142, "subRegion": 34},
    "Iraq": {"region": 142, "subRegion": 145},
    "Israel": {"region": 142, "subRegion": 145},
    "Japan": {"region": 142, "subRegion": 30},
    "Jordan": {"region": 142, "subRegion": 145},
    "Kazakhstan": {"region": 142, "subRegion": 143},
    "Kuwait": {"region": 142, "subRegion": 145},
    "Kyrgyzstan": {"region": 142, "subRegion": 143},
    "Lao People's Democratic Republic": {"region": 142, "subRegion": 35},
    "Lebanon": {"region": 142, "subRegion": 145},
    "Malaysia": {"region": 142, "subRegion": 35},
    "Maldives": {"region": 142, "subRegion": 34},
    "Mongolia": {"region": 142, "subRegion": 30},
    "Myanmar": {"region": 142, "subRegion": 35},
    "Nepal": {"region": 142, "subRegion": 34},
    "Oman": {"region": 142, "subRegion": 145},
    "Pakistan": {"region": 142, "subRegion": 34},
    "Philippines": {"region": 142, "subRegion": 35},
    "Qatar": {"region": 142, "subRegion": 145},
    "Republic of Korea": {"region": 142, "subRegion": 30},
    "Saudi Arabia": {"region": 142, "subRegion": 145},
    "Singapore": {"region": 142, "subRegion": 35},
    "Sri Lanka": {"region": 142, "subRegion": 34},
    "Syrian Arab Republic": {"region": 142, "subRegion": 145},
    "Tajikistan": {"region": 142, "subRegion": 143},
    "Thailand": {"region": 142, "subRegion": 35},
    "Timor-Leste": {"region": 142, "subRegion": 35},
    "Turkmenistan": {"region": 142, "subRegion": 143},
    "Türkiye": {"region": 142, "subRegion": 145},
    "United Arab Emirates": {"region": 142, "subRegion": 145},
    "Uzbekistan": {"region": 142, "subRegion": 143},
    "Viet Nam": {"region": 142, "subRegion": 35},
    "Yemen": {"region": 142, "subRegion": 145},

    # Europe
    "Albania": {"region": 150, "subRegion": 39},
    "Andorra": {"region": 150, "subRegion": 39},
    "Austria": {"region": 150, "subRegion": 155},
    "Belarus": {"region": 150, "subRegion": 151},
    "Belgium": {"region": 150, "subRegion": 155},
    "Bosnia and Herzegovina": {"region": 150, "subRegion": 39},
    "Bulgaria": {"region": 150, "subRegion": 151},
    "Croatia": {"region": 150, "subRegion": 39},
    "Czechia": {"region": 150, "subRegion": 151},
    "Denmark": {"region": 150, "subRegion": 154},
    "Estonia": {"region": 150, "subRegion": 154},
    "Faroe Islands": {"region": 150, "subRegion": 154},
    "Finland": {"region": 150, "subRegion": 154},
    "France": {"region": 150, "subRegion": 155},
    "Germany": {"region": 150, "subRegion": 155},
    "Greece": {"region": 150, "subRegion": 39},
    "Holy See": {"region": 150, "subRegion": 39},
    "Hungary": {"region": 150, "subRegion": 151},
    "Iceland": {"region": 150, "subRegion": 154},
    "Ireland": {"region": 150, "subRegion": 154},
    "Italy": {"region": 150, "subRegion": 39},
    "Latvia": {"region": 150, "subRegion": 154},
    "Liechtenstein": {"region": 150, "subRegion": 155},
    "Lithuania": {"region": 150, "subRegion": 154},
    "Luxembourg": {"region": 150, "subRegion": 155},
    "Malta": {"region": 150, "subRegion": 39},
    "Monaco": {"region": 150, "subRegion": 155},
    "Montenegro": {"region": 150, "subRegion": 39},
    "Netherlands": {"region": 150, "subRegion": 155},
    "North Macedonia": {"region": 150, "subRegion": 39},
    "Norway": {"region": 150, "subRegion": 154},
    "Poland": {"region": 150, "subRegion": 151},
    "Portugal": {"region": 150, "subRegion": 39},
    "Romania": {"region": 150, "subRegion": 151},
    "Russian Federation": {"region": 150, "subRegion": 151},
    "San Marino": {"region": 150, "subRegion": 39},
    "Serbia": {"region": 150, "subRegion": 39},
    "Slovakia": {"region": 150, "subRegion": 151},
    "Slovenia": {"region": 150, "subRegion": 39},
    "Spain": {"region": 150, "subRegion": 39},
    "Svalbard and Jan Mayen Islands": {"region": 150, "subRegion": 154},
    "Sweden": {"region": 150, "subRegion": 154},
    "Switzerland": {"region": 150, "subRegion": 155},
}

def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    for country in data["countries"]:
        name = country["name"]
        if name in FIXED_SUBREGIONS:
            country["region"] = FIXED_SUBREGIONS[name]["region"]
            country["subRegion"] = FIXED_SUBREGIONS[name]["subRegion"]

    data["lastUpdated"] = int(time.time() * 1000)

    Path(OUTPUT_FILE).write_text(
        json.dumps(data, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )

    print(f"✅ Updated {len(FIXED_SUBREGIONS)} countries")
    print(f"📄 Saved corrected JSON to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
