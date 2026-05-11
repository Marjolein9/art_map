import csv

new_art_paths = set()
with open("new_art.txt") as f:
    for line in f:
        line = line.strip()
        if line:
            new_art_paths.add(line)

matched = []
with open("data/multi_museum_metadata.csv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for row in reader:
        filepath = row["filepath"]
        for path in new_art_paths:
            if filepath.endswith(path):
                matched.append(row)
                break

output_path = "data/new_art_metadata.csv"
with open(output_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(matched)

print(f"Matched {len(matched)} of {len(new_art_paths)} entries -> {output_path}")
