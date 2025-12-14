# Image Conversion Summary

## ✅ Conversion Complete!

All images have been successfully converted from webp to jpg format with optimization.

### Results

- **Total Images**: 100 jpg files
- **Remaining webp**: 0 files
- **Total Size**: 200 MB
- **Format**: All images are now `.jpg`
- **Max Width**: 800 pixels (maintaining aspect ratio)
- **Quality**: 85% JPEG with optimization

### What Was Done

1. **Converted 9 webp images to jpg** with automatic resizing
2. **Fixed 1 corrupted image** (Egypt - re-downloaded from correct source)
3. **Updated all CSV files** with new `.jpg` filenames
4. **Updated database** (backend/database.db) with new filenames
5. **Deleted all original webp files**

### Database Updates

All tables updated with correct jpg filenames:

- ✅ `public_domain_images` - updated `filename` and `filepath` columns
- ✅ `albert_kahn_images` - updated `image_filename` and `new_filepath` columns
- ✅ `children_artwork_images` - updated `image_path` and `filepath` columns

### New Flask API Endpoints

Three image serving endpoints now available:

#### 1. Full-Size Images (800px max)
```
GET http://localhost:5000/images/USA/public_domain/image.jpg
```

#### 2. Thumbnail Images
```
GET http://localhost:5000/images/thumbnail/USA/public_domain/image.jpg?size=200
```
- Default: 200x200 max
- Can specify size: `?size=150` (max 500px)
- Quality: 80%

#### 3. Custom Width Resize
```
GET http://localhost:5000/images/resize/USA/public_domain/image.jpg?width=400&quality=90
```
- `width`: Target width (max 1200px)
- `quality`: JPEG quality 1-100 (default 85)

### Frontend Usage Examples

#### Simple Image
```javascript
<img src="http://localhost:5000/images/USA/public_domain/image.jpg" />
```

#### Thumbnail for Gallery
```javascript
<img
  src="http://localhost:5000/images/thumbnail/USA/public_domain/image.jpg?size=200"
  loading="lazy"
/>
```

#### Responsive Image
```javascript
<img
  src="http://localhost:5000/images/resize/USA/file.jpg?width=800"
  srcSet="
    http://localhost:5000/images/resize/USA/file.jpg?width=400 400w,
    http://localhost:5000/images/resize/USA/file.jpg?width=800 800w
  "
  sizes="(max-width: 600px) 400px, 800px"
/>
```

#### Progressive Loading
```javascript
// Show thumbnail first, then load full size
const [imageSrc, setImageSrc] = useState(
  `http://localhost:5000/images/thumbnail/${filepath}?size=200`
);

useEffect(() => {
  const fullImg = new Image();
  fullImg.src = `http://localhost:5000/images/${filepath}`;
  fullImg.onload = () => setImageSrc(fullImg.src);
}, [filepath]);

return <img src={imageSrc} />;
```

### How to Load Smaller Versions

**Answer to your question:**

1. **For thumbnails/previews**: Use the `/images/thumbnail/` endpoint with size parameter
2. **For responsive design**: Use the `/images/resize/` endpoint with width parameter
3. **For progressive loading**: Load thumbnail first, then swap to full size
4. **For pre-generated sizes**: Use the `image_utils.py` functions to create static files

### Python Utilities Created

#### `convert_images.py`
Converts webp to jpg, resizes, and updates database

```bash
python3 backend/convert_images.py
```

#### `image_utils.py`
Utility functions for image manipulation

```python
from image_utils import create_thumbnail, batch_create_thumbnails, generate_responsive_sizes

# Create single thumbnail
create_thumbnail('images/USA/file.jpg', size=(200, 200))

# Create all thumbnails
batch_create_thumbnails()

# Generate multiple sizes
generate_responsive_sizes('images/USA/file.jpg', sizes=[200, 400, 800])
```

### Sample Size Reductions

Examples from the conversion:

| Image | Original (webp) | Optimized (jpg) | Reduction |
|-------|----------------|-----------------|-----------|
| Peking Opera (China) | 1,188 KB | 159 KB | **87%** |
| Wari Textiles (Peru) | 3,662 KB | 136 KB | **96%** |
| Palestine Photos | 868 KB | 74 KB | **91%** |

### File Locations

- **Images**: `backend/images/{ISO3}/{collection_type}/image.jpg`
- **Database**: `backend/database.db`
- **CSV Files**: `backend/data/exports/*.csv`

### Testing

Start the server and test:

```bash
cd backend
python3 app.py

# In another terminal, test endpoints:
curl http://localhost:5000/images/USA/public_domain/Early_Photographs_of_Juneteenth_Celebrations.jpg -o test_full.jpg

curl "http://localhost:5000/images/thumbnail/USA/public_domain/Early_Photographs_of_Juneteenth_Celebrations.jpg?size=200" -o test_thumb.jpg

curl "http://localhost:5000/images/resize/USA/public_domain/Early_Photographs_of_Juneteenth_Celebrations.jpg?width=400" -o test_resize.jpg

# Compare sizes
ls -lh test_*.jpg
```

### Documentation

Full documentation available in:
- [IMAGE_OPTIMIZATION.md](backend/IMAGE_OPTIMIZATION.md) - Complete guide for using image optimization
- [image_utils.py](backend/image_utils.py) - Python utility functions
- [convert_images.py](backend/convert_images.py) - Conversion script

### Performance Benefits

1. **Faster page loads** - Images are already optimized to 800px max
2. **Reduced bandwidth** - 30-96% smaller file sizes
3. **Better mobile experience** - Can serve smaller thumbnails
4. **Responsive design** - Dynamic resizing based on screen size
5. **Progressive loading** - Show thumbnails while full images load

### Next Steps

1. Update your frontend to use the thumbnail endpoint for galleries/lists
2. Implement responsive images with the resize endpoint
3. Add lazy loading with `loading="lazy"` attribute
4. Consider pre-generating common sizes for better performance
5. Add caching headers to Flask endpoints for browser caching

---

**All images are now optimized and ready to use! 🎉**
