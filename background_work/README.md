# Background Work Files

This folder contains intermediate files, scripts, and reference data used during development.

## Files

- **add_iso_codes_and_download.py** - Script used to extract ISO3 codes and download artwork images from Flickr/Wikimedia
- **children_combined_added.csv** - Intermediate CSV with added ISO3 codes
- **children_combined_added.numbers** - Numbers spreadsheet version
- **children_combined_here.csv** - Working CSV file
- **population.csv** - Reference population data
- **public domain.numbers** - Public domain artwork tracking spreadsheet
- **gallery_with_country_selector.html** - Experimental gallery HTML

## Note

These files are not used by the main application. The production data is in:
- `../children_combined_with_iso3.csv` - Source CSV
- `../backend/database.db` - Production database (generated from CSV)
