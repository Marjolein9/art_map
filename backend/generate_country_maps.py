"""
Generate SVG maps for all countries with their neighbors.
This script creates static SVG files that can be served directly,
eliminating the need for client-side SVG generation.
"""

import os
import json
from db_utils import get_db_connection

# Map dimensions
MAP_WIDTH = 250
MAP_HEIGHT = 250
PADDING = 0.05  # 5% padding

# Cache for 50m TopoJSON (loaded only if needed for small islands)
_topojson_50m_cache = None

# Countries where 110m omits part of their territory — force 50m for these
# PSE: 110m only shows the West Bank; 50m has both West Bank + Gaza as MultiPolygon
PREFER_50M_M49 = {'275', '376'}  # Palestine, Israel

def load_topojson():
    """Load the TopoJSON data"""
    # Use the same TopoJSON file that the frontend uses
    topojson_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'geo', 'countries-110m.json')
    with open(topojson_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_topojson_50m():
    """
    Load the 50m TopoJSON data (lazy load with cache).
    Only called when a country is missing from 110m data.
    Returns the cached 50m TopoJSON data.
    """
    global _topojson_50m_cache

    if _topojson_50m_cache is not None:
        return _topojson_50m_cache

    # Print message (only shown once per script run)
    print("Loading 50m TopoJSON for missing countries...")

    # Load the 50m resolution file
    topojson_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'geo', 'countries-50m.json')
    with open(topojson_path, 'r', encoding='utf-8') as f:
        _topojson_50m_cache = json.load(f)

    return _topojson_50m_cache

def topojson_to_geojson(topojson_data):
    """Convert TopoJSON to GeoJSON for easier processing"""
    # This is a simplified conversion - extract arcs and convert to coordinates
    # For production, you'd want to use a proper library like topojson-client
    # But for our purposes, we'll work with the TopoJSON structure directly
    return topojson_data

def get_country_geometry_geojson(topojson, m49_code):
    """Extract and convert a country geometry from TopoJSON to GeoJSON by M49 code"""
    geometries = topojson['objects']['countries']['geometries']
    arcs = topojson['arcs']
    transform = topojson.get('transform', {})

    # Find the geometry with matching M49 code
    target_geom = None
    for geom in geometries:
        if str(geom.get('id', '')).zfill(3) == str(m49_code).zfill(3):
            target_geom = geom
            break

    if not target_geom:
        return None

    # Convert TopoJSON arcs to GeoJSON coordinates
    def decode_arc(arc_index):
        """Decode a single TopoJSON arc to coordinates"""
        is_reversed = arc_index < 0
        arc_data = arcs[~arc_index if is_reversed else arc_index]

        # Apply delta decoding and transform
        points = []
        x, y = 0, 0
        for dx, dy in arc_data:
            x += dx
            y += dy
            if transform:
                scale = transform.get('scale', [1, 1])
                translate = transform.get('translate', [0, 0])
                lon = x * scale[0] + translate[0]
                lat = y * scale[1] + translate[1]
                points.append([lon, lat])
            else:
                points.append([x, y])

        if is_reversed:
            points.reverse()

        return points

    def decode_ring(arc_indices):
        """Decode a ring (array of arc indices) to a single coordinate array"""
        ring_coords = []
        for arc_idx in arc_indices:
            arc_coords = decode_arc(arc_idx)
            # Concatenate arc coordinates, avoiding duplicate points at junctions
            if ring_coords and arc_coords:
                # If the last point of accumulated coords matches first point of new arc, skip it
                if ring_coords[-1] == arc_coords[0]:
                    ring_coords.extend(arc_coords[1:])
                else:
                    ring_coords.extend(arc_coords)
            else:
                ring_coords.extend(arc_coords)
        return ring_coords

    def convert_geometry(geom):
        """Convert TopoJSON geometry to GeoJSON geometry"""
        geom_type = geom.get('type')

        if geom_type == 'Polygon':
            return {
                'type': 'Polygon',
                'coordinates': [decode_ring(arc_set) for arc_set in geom.get('arcs', [])]
            }
        elif geom_type == 'MultiPolygon':
            return {
                'type': 'MultiPolygon',
                'coordinates': [[decode_ring(arc_set) for arc_set in polygon] for polygon in geom.get('arcs', [])]
            }
        elif geom_type == 'GeometryCollection':
            # For now, skip geometry collections
            return None

        return None

    return convert_geometry(target_geom)

def get_country_geometry_with_fallback(topojson_110m, m49_code):
    """
    Get country geometry from TopoJSON with automatic 50m fallback.

    Tries 110m resolution first for performance. If not found, or if the
    country is in PREFER_50M_M49 (fragmented territories incomplete at 110m),
    falls back to 50m resolution.

    Args:
        topojson_110m: The 110m resolution TopoJSON data
        m49_code: The M49 country code to search for

    Returns:
        GeoJSON geometry dict, or None if not found in either resolution
    """
    m49_str = str(m49_code).zfill(3)

    # For countries known to be incomplete at 110m, go straight to 50m
    if m49_str in PREFER_50M_M49:
        topojson_50m = load_topojson_50m()
        return get_country_geometry_geojson(topojson_50m, m49_code)

    # Try 110m first
    geometry = get_country_geometry_geojson(topojson_110m, m49_code)

    if geometry is not None:
        return geometry

    # Not found in 110m, try 50m
    topojson_50m = load_topojson_50m()
    return get_country_geometry_geojson(topojson_50m, m49_code)

def calculate_bounds(features):
    """Calculate bounding box for a list of geometries"""
    min_lng, max_lng = float('inf'), float('-inf')
    min_lat, max_lat = float('inf'), float('-inf')

    def process_coords(coords):
        nonlocal min_lng, max_lng, min_lat, max_lat
        if isinstance(coords[0], (int, float)):
            # It's a coordinate pair [lng, lat]
            lng, lat = coords
            min_lng = min(min_lng, lng)
            max_lng = max(max_lng, lng)
            min_lat = min(min_lat, lat)
            max_lat = max(max_lat, lat)
        else:
            # It's nested, recurse
            for c in coords:
                process_coords(c)

    for feature in features:
        if feature and 'coordinates' in feature:
            process_coords(feature['coordinates'])

    if min_lng == float('inf'):
        return None

    # Add padding
    lng_padding = (max_lng - min_lng) * PADDING
    lat_padding = (max_lat - min_lat) * PADDING

    return {
        'min_lng': min_lng - lng_padding,
        'max_lng': max_lng + lng_padding,
        'min_lat': min_lat - lat_padding,
        'max_lat': max_lat + lat_padding
    }

def project_point(lng, lat, bounds, width, height):
    """Project a coordinate to SVG space"""
    lng_range = bounds['max_lng'] - bounds['min_lng']
    lat_range = bounds['max_lat'] - bounds['min_lat']

    # Calculate scale to fit within dimensions
    scale = min(width / lng_range, height / lat_range)

    # Center the map
    offset_x = (width - lng_range * scale) / 2
    offset_y = (height - lat_range * scale) / 2

    x = (lng - bounds['min_lng']) * scale + offset_x
    y = height - ((lat - bounds['min_lat']) * scale + offset_y)

    return x, y

def coords_to_svg_path(coords, bounds, width, height, is_first=True):
    """Convert coordinates to SVG path string"""
    if not coords:
        return ''

    # Check if it's a coordinate pair
    if isinstance(coords[0], (int, float)):
        x, y = project_point(coords[0], coords[1], bounds, width, height)
        return f"{x},{y}"

    # Check if it's a list of coordinate pairs
    if isinstance(coords[0], list) and len(coords[0]) == 2 and isinstance(coords[0][0], (int, float)):
        # Filter valid coordinates
        valid_coords = [c for c in coords if len(c) >= 2 and abs(c[0]) <= 180 and abs(c[1]) <= 90]

        if not valid_coords:
            return ''

        # Build path with antimeridian handling
        path_segments = []
        current_segment = []

        for i, coord in enumerate(valid_coords):
            if i == 0:
                current_segment.append(coord)
            else:
                prev_lng = valid_coords[i-1][0]
                curr_lng = coord[0]
                lng_diff = abs(curr_lng - prev_lng)

                # If crossing antimeridian, start new segment
                if lng_diff > 180:
                    if current_segment:
                        path_segments.append(current_segment)
                    current_segment = [coord]
                else:
                    current_segment.append(coord)

        if current_segment:
            path_segments.append(current_segment)

        # Convert segments to SVG
        result = []
        for segment in path_segments:
            if len(segment) < 2:
                continue
            segment_path = []
            for j, coord in enumerate(segment):
                x, y = project_point(coord[0], coord[1], bounds, width, height)
                if j == 0:
                    segment_path.append(f"M {x},{y}")
                else:
                    segment_path.append(f"L {x},{y}")
            if segment_path:
                segment_path.append("Z")
                result.append(" ".join(segment_path))

        return " ".join(result)

    # It's nested, recurse
    return " ".join(coords_to_svg_path(ring, bounds, width, height, False) for ring in coords)

def geometry_to_svg_path(geometry, bounds, width, height):
    """Convert a geometry to SVG path"""
    if not geometry or not bounds:
        return ''

    geom_type = geometry.get('type')
    coords = geometry.get('coordinates', [])

    if geom_type == 'Polygon':
        return coords_to_svg_path(coords, bounds, width, height)
    elif geom_type == 'MultiPolygon':
        paths = [coords_to_svg_path(polygon, bounds, width, height) for polygon in coords]
        return " ".join(p for p in paths if p)

    return ''

def generate_country_map(iso3, m49, topojson, conn):
    """Generate SVG map for a country with its neighbors"""
    # Get neighbors (excluding France and Russia)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT c.iso3, c.m49, c.name, c.common_name
        FROM country_borders cb
        JOIN countries c ON cb.neighbor_iso3 = c.iso3
        WHERE cb.country_iso3 = %s
        ORDER BY c.common_name
    ''', (iso3,))
    neighbors = cursor.fetchall()
    filtered_neighbors = [n for n in neighbors if n['iso3'] not in ['FRA', 'RUS']]

    # Get target country geometry (converted from TopoJSON to GeoJSON)
    target_geom = get_country_geometry_with_fallback(topojson, m49)
    if not target_geom:
        print(f"  Warning: No geometry found for {iso3} (M49: {m49}) in either 110m or 50m")
        return None

    # Get neighbor geometries
    neighbor_geoms = []
    for neighbor in filtered_neighbors:
        neighbor_geom = get_country_geometry_with_fallback(topojson, neighbor['m49'])
        if neighbor_geom:
            neighbor_geoms.append(neighbor_geom)

    # Calculate bounds
    all_geoms = [target_geom] + neighbor_geoms
    bounds = calculate_bounds(all_geoms)

    if not bounds:
        print(f"  Warning: Could not calculate bounds for {iso3}")
        return None

    # Calculate dynamic height based on aspect ratio
    lng_range = bounds['max_lng'] - bounds['min_lng']
    lat_range = bounds['max_lat'] - bounds['min_lat']
    aspect_ratio = lat_range / lng_range if lng_range > 0 else 1

    map_height = round(MAP_WIDTH * aspect_ratio)
    map_height = max(125, min(350, map_height))  # Clamp between 125 and 350

    # Generate SVG paths
    target_path = geometry_to_svg_path(target_geom, bounds, MAP_WIDTH, map_height)

    neighbor_paths = []
    for geom in neighbor_geoms:
        path = geometry_to_svg_path(geom, bounds, MAP_WIDTH, map_height)
        if path:
            neighbor_paths.append(path)

    # Create SVG
    svg = f'''<svg viewBox="0 0 {MAP_WIDTH} {map_height}" xmlns="http://www.w3.org/2000/svg" style="background-color: #e8f4f8; border: 2px solid #000000; border-radius: 4px;">
'''

    # Add neighbor countries
    for path in neighbor_paths:
        svg += f'  <path d="{path}" fill="#d0e8f0" stroke="#5a8fa8" stroke-width="1" opacity="0.6"/>\n'

    # Add target country
    if target_path:
        svg += f'  <path d="{target_path}" fill="#ff6b6b" stroke="#d63031" stroke-width="2" opacity="0.8"/>\n'

    svg += '</svg>'

    return svg

def main():
    """Generate maps for all countries"""
    # Create output directory
    output_dir = os.path.join(os.path.dirname(__file__), 'static', 'maps')
    os.makedirs(output_dir, exist_ok=True)

    # Load TopoJSON
    print("Loading TopoJSON...")
    topojson = load_topojson()

    # Get all countries from database
    print("Fetching countries from database...")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT iso3, m49, common_name FROM countries WHERE include_in_quiz = TRUE ORDER BY iso3")
    countries = cursor.fetchall()

    print(f"Generating maps for {len(countries)} countries...\n")

    success_count = 0
    error_count = 0

    for country in countries:
        iso3 = country['iso3']
        m49 = country['m49']
        name = country['common_name']
        print(f"Generating map for {iso3} ({name})...")

        try:
            svg = generate_country_map(iso3, m49, topojson, conn)

            if svg:
                # Save SVG file
                output_path = os.path.join(output_dir, f"{iso3}.svg")
                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(svg)
                print(f"  ✓ Saved to {output_path}")
                success_count += 1
            else:
                print(f"  ✗ Failed to generate map")
                error_count += 1

        except Exception as e:
            print(f"  ✗ Error: {e}")
            error_count += 1

    conn.close()

    print(f"\n{'='*60}")
    print(f"Generation complete!")
    print(f"Success: {success_count}")
    print(f"Errors: {error_count}")
    print(f"Total: {len(countries)}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
