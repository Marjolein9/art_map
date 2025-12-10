#!/usr/bin/env python3
"""
Image utility functions for creating thumbnails and smaller versions
"""

import os
from PIL import Image
from pathlib import Path

def create_thumbnail(image_path, thumbnail_dir='thumbnails', size=(200, 200)):
    """
    Create a thumbnail version of an image

    Args:
        image_path: Path to the original image
        thumbnail_dir: Directory to save thumbnails (relative to backend)
        size: Tuple of (max_width, max_height) for thumbnail

    Returns:
        Path to thumbnail or None if failed
    """
    try:
        # Open the image
        img = Image.open(image_path)

        # Convert to RGB if needed
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # Create thumbnail (maintains aspect ratio)
        img.thumbnail(size, Image.LANCZOS)

        # Create output directory structure mirroring the original
        # e.g., images/USA/public_domain/image.jpg -> thumbnails/USA/public_domain/image.jpg
        rel_path = os.path.relpath(image_path, 'backend/images')
        thumbnail_path = os.path.join('backend', thumbnail_dir, rel_path)

        # Create directory
        os.makedirs(os.path.dirname(thumbnail_path), exist_ok=True)

        # Save thumbnail
        img.save(thumbnail_path, 'JPEG', quality=80, optimize=True)

        return thumbnail_path

    except Exception as e:
        print(f"Error creating thumbnail for {image_path}: {e}")
        return None

def resize_image(image_path, max_width=None, max_height=None, quality=85):
    """
    Resize an image to fit within max dimensions

    Args:
        image_path: Path to the image
        max_width: Maximum width (None = no limit)
        max_height: Maximum height (None = no limit)
        quality: JPEG quality (1-100)

    Returns:
        PIL Image object
    """
    img = Image.open(image_path)

    # Convert to RGB if needed
    if img.mode != 'RGB':
        img = img.convert('RGB')

    width, height = img.size

    # Calculate new size if needed
    if max_width or max_height:
        # Calculate scaling ratio
        ratios = []
        if max_width and width > max_width:
            ratios.append(max_width / width)
        if max_height and height > max_height:
            ratios.append(max_height / height)

        if ratios:
            # Use the most restrictive ratio
            ratio = min(ratios)
            new_width = int(width * ratio)
            new_height = int(height * ratio)
            img = img.resize((new_width, new_height), Image.LANCZOS)

    return img

def generate_responsive_sizes(image_path, output_dir='responsive', sizes=[200, 400, 800]):
    """
    Generate multiple sizes of an image for responsive web delivery

    Args:
        image_path: Path to the original image
        output_dir: Directory to save responsive versions
        sizes: List of widths to generate

    Returns:
        Dictionary mapping size to filepath
    """
    try:
        img = Image.open(image_path)

        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Get base filename without extension
        filename = Path(image_path).stem

        # Create output directory structure
        rel_path = os.path.relpath(os.path.dirname(image_path), 'backend/images')
        output_base = os.path.join('backend', output_dir, rel_path)
        os.makedirs(output_base, exist_ok=True)

        generated = {}

        for size in sorted(sizes):
            # Skip if original is smaller
            if img.width <= size:
                continue

            # Resize
            ratio = size / img.width
            new_height = int(img.height * ratio)
            resized = img.resize((size, new_height), Image.LANCZOS)

            # Save
            output_path = os.path.join(output_base, f"{filename}_{size}w.jpg")
            resized.save(output_path, 'JPEG', quality=85, optimize=True)

            generated[size] = output_path

        return generated

    except Exception as e:
        print(f"Error generating responsive sizes for {image_path}: {e}")
        return {}

def batch_create_thumbnails(images_dir='backend/images', thumbnail_dir='backend/thumbnails', size=(200, 200)):
    """
    Create thumbnails for all images in a directory

    Args:
        images_dir: Directory containing images
        thumbnail_dir: Directory to save thumbnails
        size: Thumbnail size
    """
    print(f"Creating thumbnails from {images_dir}...")

    count = 0
    for root, dirs, files in os.walk(images_dir):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                image_path = os.path.join(root, file)
                thumbnail_path = create_thumbnail(image_path, thumbnail_dir, size)
                if thumbnail_path:
                    count += 1
                    if count % 10 == 0:
                        print(f"  Created {count} thumbnails...")

    print(f"✅ Created {count} thumbnails in {thumbnail_dir}")

# Example usage for Flask/web serving
def get_image_srcset(image_path, sizes=[200, 400, 800]):
    """
    Generate HTML srcset attribute for responsive images

    Returns:
        String for srcset attribute

    Example:
        <img src="image_800w.jpg"
             srcset="image_200w.jpg 200w, image_400w.jpg 400w, image_800w.jpg 800w"
             sizes="(max-width: 600px) 200px, (max-width: 1000px) 400px, 800px">
    """
    # In production, you would generate these files first
    # This just shows how to construct the srcset

    filename = Path(image_path).stem
    srcset_parts = []

    for size in sizes:
        srcset_parts.append(f"{filename}_{size}w.jpg {size}w")

    return ", ".join(srcset_parts)

if __name__ == '__main__':
    # Example: Create thumbnails for all images
    print("Image Utilities")
    print("=" * 60)
    print("\nTo create thumbnails for all images, run:")
    print("  from image_utils import batch_create_thumbnails")
    print("  batch_create_thumbnails()")
    print("\nTo create a single thumbnail:")
    print("  from image_utils import create_thumbnail")
    print("  create_thumbnail('backend/images/USA/public_domain/image.jpg')")
    print("\nTo generate responsive sizes:")
    print("  from image_utils import generate_responsive_sizes")
    print("  generate_responsive_sizes('backend/images/USA/public_domain/image.jpg')")
