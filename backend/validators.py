"""
Input validation utilities for API endpoints

This module provides validation functions to ensure API inputs are safe and well-formed.
Prevents common security issues like SQL injection and improves error messages.
"""
import re
from flask import jsonify


# Valid ISO 3166-1 alpha-3 country codes are 3 uppercase letters
ISO3_PATTERN = re.compile(r'^[A-Z]{3}$')

# Valid continent/region names for filtering
VALID_REGIONS = {
    'Africa',
    'Americas',
    'Asia',
    'Europe',
    'Oceania',
    'Antarctica',
    'not_africa',
}


class ValidationError(Exception):
    """
    Raised when input validation fails

    This custom exception allows endpoints to distinguish validation errors
    from other types of errors and return appropriate HTTP status codes.
    """
    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


def validate_iso3(iso3: str) -> str:
    """
    Validate ISO3 country code format

    ISO3 codes are 3-letter country codes defined by ISO 3166-1 alpha-3 standard.
    Examples: USA, DEU, FRA, GBR, JPN

    Args:
        iso3: The ISO3 code to validate

    Returns:
        The validated ISO3 code in uppercase

    Raises:
        ValidationError: If iso3 is None, empty, or invalid format

    Examples:
        >>> validate_iso3('usa')
        'USA'
        >>> validate_iso3('US')
        ValidationError: Invalid ISO3 format: US. Must be 3 letters.
    """
    if not iso3:
        raise ValidationError('ISO3 code is required', status_code=400)

    iso3_upper = iso3.upper()

    if not ISO3_PATTERN.match(iso3_upper):
        raise ValidationError(
            f'Invalid ISO3 format: {iso3}. Must be 3 letters.',
            status_code=400
        )

    return iso3_upper


def validate_region(region: str) -> str:
    """
    Validate region/continent name

    Regions are used to filter quiz questions and images by geographic area.

    Args:
        region: The region name to validate

    Returns:
        The validated region name, or None if region is empty

    Raises:
        ValidationError: If region is provided but not in the valid set

    Examples:
        >>> validate_region('Europe')
        'Europe'
        >>> validate_region('Middle Earth')
        ValidationError: Invalid region: Middle Earth. Must be one of: ...
        >>> validate_region(None)
        None
    """
    if not region:
        return None

    if region not in VALID_REGIONS:
        raise ValidationError(
            f'Invalid region: {region}. Must be one of: {", ".join(sorted(VALID_REGIONS))}',
            status_code=400
        )

    return region


def validate_json_body(data: dict, required_fields: list) -> dict:
    """
    Validate JSON request body

    Ensures the request body is valid JSON and contains all required fields.
    This prevents AttributeError when trying to access missing fields.

    Args:
        data: The JSON data from request.get_json()
        required_fields: List of required field names

    Returns:
        The validated data dictionary

    Raises:
        ValidationError: If data is None, not a dict, or missing required fields

    Examples:
        >>> validate_json_body({'name': 'John'}, ['name'])
        {'name': 'John'}
        >>> validate_json_body(None, ['name'])
        ValidationError: Request body must be JSON
        >>> validate_json_body({'age': 30}, ['name'])
        ValidationError: Missing required fields: name
    """
    if data is None:
        raise ValidationError('Request body must be JSON', status_code=400)

    if not isinstance(data, dict):
        raise ValidationError('Request body must be a JSON object', status_code=400)

    missing_fields = [field for field in required_fields if field not in data]

    if missing_fields:
        raise ValidationError(
            f'Missing required fields: {", ".join(missing_fields)}',
            status_code=400
        )

    return data


def validate_boolean(value, param_name: str) -> bool:
    """
    Validate and convert boolean query parameters

    Query parameters come in as strings ('true', 'false', '1', '0').
    This function safely converts them to Python booleans.

    Args:
        value: The query parameter value (usually a string)
        param_name: Name of the parameter (for error messages)

    Returns:
        Boolean value

    Raises:
        ValidationError: If value cannot be converted to boolean

    Examples:
        >>> validate_boolean('true', 'showNudity')
        True
        >>> validate_boolean('false', 'showNudity')
        False
        >>> validate_boolean('1', 'hintsEnabled')
        True
        >>> validate_boolean('maybe', 'test')
        ValidationError: Invalid boolean value for test: maybe
    """
    if value is None:
        return False

    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        lower_value = value.lower()
        if lower_value in ('true', '1', 'yes'):
            return True
        elif lower_value in ('false', '0', 'no', ''):
            return False

    raise ValidationError(
        f'Invalid boolean value for {param_name}: {value}. Must be true/false or 1/0.',
        status_code=400
    )
