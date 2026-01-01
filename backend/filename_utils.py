#!/usr/bin/env python3
"""
Filename Utilities

Shared utilities for sanitizing and managing filenames across all scripts.
This ensures consistent filename handling in init_database, sanitize_filenames, etc.
"""

import re


def sanitize_filename(text):
    """
    Create a safe filename from text.

    This is the canonical sanitization function used across all scripts.

    Rules:
    - Remove all special characters except alphanumeric, spaces, hyphens, underscores
    - Replace spaces with underscores
    - Remove consecutive underscores
    - Trim leading/trailing underscores
    - Add .jpg extension

    Args:
        text: Input text (usually a title)

    Returns:
        Sanitized filename ending in .jpg, or None if text is empty

    Examples:
        "Mother & Child" -> "Mother_Child.jpg"
        "Mrs. Hughes Portrait" -> "Mrs_Hughes_Portrait.jpg"
        "Portrait  (1890)" -> "Portrait_1890.jpg"
    """
    if not text:
        return None

    # Remove special characters, keep only alphanumeric, spaces, hyphens
    # This regex removes: periods, ampersands, parentheses, etc.
    cleaned = re.sub(r'[^\w\s-]', '', text)

    # Replace whitespace with underscores
    cleaned = re.sub(r'\s+', '_', cleaned)

    # Remove multiple consecutive underscores
    cleaned = re.sub(r'_+', '_', cleaned)

    # Trim underscores from start and end
    cleaned = cleaned.strip('_')

    if not cleaned:
        return None

    return f"{cleaned}.jpg"
