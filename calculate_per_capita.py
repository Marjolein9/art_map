import csv
from collections import defaultdict

print("="*80)
print("USAID DISBURSEMENTS PER CAPITA CALCULATOR - 2021")
print("="*80)

# Step 1: Read USAID disbursements data
print("\n[1/5] Reading USAID disbursements data...")

country_disbursements = {}  # code -> {name, amount}
sector_disbursements = defaultdict(float)  # sector name -> amount
country_sector_disbursements = defaultdict(lambda: defaultdict(float))  # country_code -> sector -> amount
total_rows = 0

with open('distribution_per_country.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)

    for row in reader:
        total_rows += 1
        if total_rows % 10000 == 0:
            print(f"      Processed {total_rows:,} rows...")

        # Filter for 2021 fiscal year
        if row['Fiscal Year'] == '2021':
            country_code = row['Country Code']
            country_name = row['Country Name']
            sector_name = row.get('International Sector Name', 'Unknown')

            # Fix country code mappings
            if country_code == 'SDF':
                country_code = 'SDN'
                country_name = 'Sudan'
            elif country_code == 'CS-KM':
                country_code = 'XKX'
                country_name = 'Kosovo'

            try:
                amount = float(row['Current Dollar Amount'])

                # Track by country
                if country_code not in country_disbursements:
                    country_disbursements[country_code] = {'name': country_name, 'amount': 0}
                country_disbursements[country_code]['amount'] += amount

                # Track by sector
                sector_disbursements[sector_name] += amount

                # Track by country and sector
                country_sector_disbursements[country_code][sector_name] += amount

            except (ValueError, KeyError):
                continue

print(f"      Total rows processed: {total_rows:,}")
print(f"      Total countries with disbursements: {len(country_disbursements)}")
print(f"      Total sectors: {len(sector_disbursements)}")

# Step 2: Read population data
print("\n[2/5] Reading population data for 2021...")

country_population = {}  # code -> {name, population}

with open('population.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)  # Read header

    # Find the indices we need
    try:
        year_2021_idx = header.index('2021')
        country_code_idx = header.index('REF_AREA')
        country_name_idx = header.index('REF_AREA_LABEL')
    except ValueError as e:
        print(f"ERROR: Could not find required column: {e}")
        exit(1)

    for row in reader:
        country_code = row[country_code_idx]
        country_name = row[country_name_idx]
        try:
            population = float(row[year_2021_idx])
            country_population[country_code] = {'name': country_name, 'population': population}
        except (ValueError, IndexError):
            continue

print(f"      Countries with population data: {len(country_population)}")

# Step 3: Calculate per capita disbursements by country
print("\n[3/5] Calculating per capita disbursements by country...")

results = []
matched_countries = 0
unmatched_countries = []

for country_code, disb_data in country_disbursements.items():
    # Try to find matching population data using country code
    pop_data = country_population.get(country_code)

    if pop_data and pop_data['population'] > 0:
        per_capita = disb_data['amount'] / pop_data['population']
        results.append({
            'code': country_code,
            'country': disb_data['name'],
            'disbursement': disb_data['amount'],
            'population': pop_data['population'],
            'per_capita': per_capita
        })
        matched_countries += 1
    else:
        unmatched_countries.append({
            'code': country_code,
            'name': disb_data['name'],
            'amount': disb_data['amount']
        })

# Sort by per capita (descending)
results.sort(key=lambda x: x['per_capita'], reverse=True)

print(f"      Matched countries: {matched_countries}")
print(f"      Unmatched countries: {len(unmatched_countries)}")

# Step 4: Save country results
print("\n[4/5] Saving country results...")

# Save per capita results
output_file = 'usaid_per_capita_2021.csv'
with open(output_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['Country_Code', 'Country', 'Per_Capita_USD', 'Total_Disbursement_USD', 'Population'])
    for r in results:
        writer.writerow([r['code'], r['country'], f"{r['per_capita']:.2f}", r['disbursement'], int(r['population'])])

print(f"      ✓ Per capita results saved to: {output_file}")

# Save unmatched countries for reference
if unmatched_countries:
    with open('unmatched_countries.txt', 'w', encoding='utf-8') as f:
        f.write("Countries with disbursements but no population data:\n")
        f.write("="*70 + "\n")
        f.write(f"{'Code':<6} {'Country':<40} {'Disbursement':>20}\n")
        f.write("-"*70 + "\n")
        for uc in sorted(unmatched_countries, key=lambda x: x['amount'], reverse=True):
            f.write(f"{uc['code']:<6} {uc['name']:<40} ${uc['amount']:>18,.2f}\n")
    print(f"      ✓ Unmatched countries saved to: unmatched_countries.txt")

# Display summary statistics
print("\n" + "="*80)
print("SUMMARY")
print("="*80)

# Calculate totals
total_disbursed_all = sum(data['amount'] for data in country_disbursements.values())
total_disbursed_matched = sum(r['disbursement'] for r in results)
total_disbursed_unmatched = sum(uc['amount'] for uc in unmatched_countries)
total_population = sum(r['population'] for r in results)
overall_per_capita = total_disbursed_matched / total_population if total_population > 0 else 0

print(f"Total disbursed (all): ${total_disbursed_all:,.2f}")
print(f"Total disbursed to matched countries: ${total_disbursed_matched:,.2f}")
print(f"Total disbursed to unmatched entities: ${total_disbursed_unmatched:,.2f}")
print(f"Percentage allocated to countries with population: {(total_disbursed_matched/total_disbursed_all*100):.1f}%")
print(f"Percentage NOT allocated by country with population: {(total_disbursed_unmatched/total_disbursed_all*100):.1f}%")
print(f"\nTotal population of matched countries: {total_population:,.0f}")
print(f"Overall per capita (matched countries): ${overall_per_capita:.2f}")

print("\nTop 10 countries by per capita disbursement:")
print(f"{'Code':<6} {'Country':<35} {'Per Capita':>15} {'Total':>20} {'Population':>15}")
print("-" * 98)
for r in results[:10]:
    print(f"{r['code']:<6} {r['country']:<35} ${r['per_capita']:>14,.2f} ${r['disbursement']:>18,.0f} {r['population']:>14,.0f}")

print("\nBottom 10 countries by per capita disbursement:")
print(f"{'Code':<6} {'Country':<35} {'Per Capita':>15} {'Total':>20} {'Population':>15}")
print("-" * 98)
for r in results[-10:]:
    print(f"{r['code']:<6} {r['country']:<35} ${r['per_capita']:>14,.2f} ${r['disbursement']:>18,.0f} {r['population']:>14,.0f}")

print("\n" + "="*80)
print("COMPLETE!")
print("="*80)

# Step 5: Calculate and save sector analysis by country
print("\n" + "="*80)
print("STEP 5: SECTOR ANALYSIS BY COUNTRY")
print("="*80)

# Calculate per capita by sector for each country
country_sector_results = []

for country_code, sectors in country_sector_disbursements.items():
    # Get population for this country
    pop_data = country_population.get(country_code)

    if pop_data and pop_data['population'] > 0:
        country_name = country_disbursements[country_code]['name']
        population = pop_data['population']

        for sector_name, sector_amount in sectors.items():
            per_capita = sector_amount / population

            country_sector_results.append({
                'country_code': country_code,
                'country': country_name,
                'sector': sector_name,
                'disbursement': sector_amount,
                'population': population,
                'per_capita': per_capita
            })

# Sort by country, then by sector disbursement (descending)
country_sector_results.sort(key=lambda x: (x['country_code'], -x['disbursement']))

# Save sector by country results
sector_output_file = 'usaid_per_capita_by_sector_country_2021.csv'
with open(sector_output_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['Country_Code', 'Country', 'Sector', 'Total_Disbursement_USD', 'Population', 'Per_Capita_USD'])
    for s in country_sector_results:
        writer.writerow([
            s['country_code'],
            s['country'],
            s['sector'],
            s['disbursement'],
            int(s['population']),
            f"{s['per_capita']:.2f}"
        ])

print(f"✓ Sector by country analysis saved to: {sector_output_file}")
print(f"   Total records: {len(country_sector_results):,}")

# Display sample - top 10 country-sector combinations by per capita
print(f"\nTop 10 country-sector combinations by per capita:")
sorted_by_per_capita = sorted(country_sector_results, key=lambda x: x['per_capita'], reverse=True)
print(f"{'Code':<6} {'Country':<25} {'Sector':<30} {'Per Capita':>15}")
print("-" * 78)
for s in sorted_by_per_capita[:10]:
    print(f"{s['country_code']:<6} {s['country']:<25} {s['sector']:<30} ${s['per_capita']:>14,.2f}")

print("\n" + "="*80)
print("ALL COMPLETE!")
print("="*80)
