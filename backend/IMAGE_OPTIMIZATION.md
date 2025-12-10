# Image Optimization Guide

## Summary of Changes

All images have been converted from webp to jpg format with the following optimizations:

- **Format**: All images converted from `.webp` to `.jpg`
- **Maximum Width**: 800 pixels (maintaining aspect ratio)
- **Quality**: 85% JPEG quality with optimization
- **Database**: All CSV files and database tables updated with new filenames

## Conversion Results

- ✅ **9 images** successfully converted and resized
- ✅ **1 image** (Egypt) re-downloaded from correct source
- ✅ **0 webp files** remaining (all converted to jpg)
- ✅ **Average file size reduction**: ~30-60% depending on original size

### Examples of Size Reduction:

| Country | Original (webp) | Optimized (jpg) | Reduction |
|---------|----------------|-----------------|-----------|
| China   | 1,188 KB       | 159 KB          | 87%       |
| Peru    | 3,662 KB       | 136 KB          | 96%       |
| Suriname| 820 KB         | 136 KB          | 83%       |
| Palestine| 868 KB        | 74 KB           | 91%       |

## How to Load Smaller Image Versions

### 1. Full-Size Images (800px max)

All images are already optimized to 800px max width:

```javascript
// Frontend usage
<img src="http://localhost:5000/images/USA/public_domain/image.jpg" />
```

### 2. Thumbnail Images (Dynamic)

Use the thumbnail endpoint for smaller preview images:

```javascript
// Default 200x200 thumbnail
<img src="http://localhost:5000/images/thumbnail/USA/public_domain/image.jpg" />

// Custom size (e.g., 150x150)
<img src="http://localhost:5000/images/thumbnail/USA/public_domain/image.jpg?size=150" />
```

**Parameters:**
- `size`: Maximum dimension in pixels (default: 200, max: 500)
- Maintains aspect ratio
- Quality: 80% (optimized for thumbnails)

### 3. Custom Width Resize

Dynamically resize images to any width:

```javascript
// Resize to 400px width
<img src="http://localhost:5000/images/resize/USA/public_domain/image.jpg?width=400" />

// With custom quality
<img src="http://localhost:5000/images/resize/USA/public_domain/image.jpg?width=400&quality=90" />
```

**Parameters:**
- `width`: Target width in pixels (required, max: 1200)
- `quality`: JPEG quality 1-100 (default: 85)
- Height automatically calculated to maintain aspect ratio

## Frontend Implementation Examples

### Responsive Images with srcset

```javascript
// React example
<img
  src="http://localhost:5000/images/resize/USA/file.jpg?width=800"
  srcSet="
    http://localhost:5000/images/resize/USA/file.jpg?width=400 400w,
    http://localhost:5000/images/resize/USA/file.jpg?width=800 800w
  "
  sizes="(max-width: 600px) 400px, 800px"
  alt="Image"
/>
```

### Lazy Loading Gallery

```javascript
// Load thumbnails first, then full images on click
function ImageGallery({ images }) {
  return (
    <div className="gallery">
      {images.map(img => (
        <img
          key={img.id}
          src={`http://localhost:5000/images/thumbnail/${img.filepath}?size=200`}
          onClick={() => showFullImage(img.filepath)}
          loading="lazy"
        />
      ))}
    </div>
  );
}
```

### Progressive Loading

```javascript
// Show thumbnail first, then load full size
const [imageSrc, setImageSrc] = useState(
  `http://localhost:5000/images/thumbnail/${filepath}?size=200`
);

useEffect(() => {
  // Load full size image in background
  const fullImg = new Image();
  fullImg.src = `http://localhost:5000/images/${filepath}`;
  fullImg.onload = () => setImageSrc(fullImg.src);
}, [filepath]);

return <img src={imageSrc} alt="..." />;
```

## Python Utilities

### Create Static Thumbnails

For better performance, you can pre-generate thumbnails:

```python
from image_utils import batch_create_thumbnails

# Create 200x200 thumbnails for all images
batch_create_thumbnails(
    images_dir='backend/images',
    thumbnail_dir='backend/thumbnails',
    size=(200, 200)
)
```

### Generate Responsive Sizes

Pre-generate multiple sizes for responsive delivery:

```python
from image_utils import generate_responsive_sizes

# Generate 200px, 400px, and 800px versions
sizes = generate_responsive_sizes(
    'backend/images/USA/public_domain/image.jpg',
    output_dir='responsive',
    sizes=[200, 400, 800]
)
```

## Backend Scripts

### Convert Images (if you add new webp files)

```bash
python3 backend/convert_images.py
```

This will:
- Find all `.webp` images
- Convert to `.jpg` format
- Resize to max 800px width
- Update CSV files and database
- Delete original webp files

### Fix Individual Images

If you need to re-download or fix a specific image:

```python
# Edit fix_egypt_image.py with your image details
python3 backend/fix_egypt_image.py
```

## Performance Tips

### 1. Use Thumbnails for Lists

Always use thumbnails when showing multiple images:

```javascript
// ✅ Good - fast loading
images.map(img =>
  <img src={`/images/thumbnail/${img.filepath}?size=200`} />
)

// ❌ Bad - slow loading
images.map(img =>
  <img src={`/images/${img.filepath}`} />
)
```

### 2. Implement Lazy Loading

```javascript
<img loading="lazy" src="..." />
```

### 3. Cache on Frontend

```javascript
const imageCache = new Map();

function getCachedImage(url) {
  if (!imageCache.has(url)) {
    imageCache.set(url, fetch(url).then(r => r.blob()));
  }
  return imageCache.get(url);
}
```

### 4. Use WebP for Modern Browsers (Future Enhancement)

```javascript
<picture>
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="..." />
</picture>
```

## API Endpoints Summary

| Endpoint | Purpose | Parameters | Example |
|----------|---------|------------|---------|
| `/images/<path>` | Full-size image (800px max) | None | `/images/USA/file.jpg` |
| `/images/thumbnail/<path>` | Thumbnail version | `size` (default 200) | `/images/thumbnail/USA/file.jpg?size=150` |
| `/images/resize/<path>` | Custom width resize | `width`, `quality` | `/images/resize/USA/file.jpg?width=400&quality=90` |

## Database Schema

All tables now reference `.jpg` files:

### public_domain_images
- `filename`: "image_name.jpg"
- `filepath`: "images/USA/public_domain/image_name.jpg"

### albert_kahn_images
- `image_filename`: "image_name.jpg"
- `new_filepath`: "images/USA/albert_kahn/image_name.jpg"

### children_artwork_images
- `image_path`: Original URL or filename
- `filepath`: "images/USA/children_artwork/image_name.jpg"

## Testing

Test the endpoints:

```bash
# Start the server
python3 backend/app.py

# Test full-size image
curl http://localhost:5000/images/USA/public_domain/image.jpg -o test_full.jpg

# Test thumbnail
curl "http://localhost:5000/images/thumbnail/USA/public_domain/image.jpg?size=200" -o test_thumb.jpg

# Test resize
curl "http://localhost:5000/images/resize/USA/public_domain/image.jpg?width=400" -o test_resize.jpg

# Compare file sizes
ls -lh test_*.jpg
```

## Future Enhancements

1. **Add caching headers** to image endpoints for better browser caching
2. **Implement CDN** for faster global delivery
3. **Add WebP support** alongside JPEG for browsers that support it
4. **Pre-generate multiple sizes** during database initialization
5. **Add image compression levels** for different quality tiers
6. **Implement blur hash** for ultra-fast placeholders
