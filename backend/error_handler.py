"""
Standardized Error Handling for Art Map API

This module provides a unified error handling system for the Flask backend.
Instead of inconsistent error responses throughout the codebase, all errors
go through this standardized system.

REFACTORING INSIGHT: Centralized Error Handling
===============================================

Before:
  Route 1: return {'error': 'Not found'}, 404
  Route 2: return {'message': 'Error occurred'}, 500
  Route 3: return 'Something went wrong', 500
  ↑ Inconsistent responses make frontend error handling difficult

After:
  All routes: raise APIError('message', code, {'details': 'info'})
  ↓ Consistent format across entire API

Benefits:
1. Frontend can reliably parse error responses
2. Error logging is centralized
3. Easy to add features (retry info, request IDs, etc.)
4. Easier debugging with structured error data
5. Consistent HTTP status codes

Design Pattern: Exception Hierarchy
===================================
APIError (base)
  ├── ValidationError (400)
  ├── NotFoundError (404)
  ├── ConflictError (409)
  └── InternalError (500)

This allows different error types without losing uniformity.
"""

from datetime import datetime


class APIError(Exception):
    """
    Base exception class for all Art Map API errors.
    
    Provides standardized error responses with structured data.
    
    INTERVIEW PREP: Custom Exception Classes
    =========================================
    Why create custom exceptions?
    1. Semantic: APIError is more meaningful than generic Exception
    2. Catchable: Can catch APIError specifically, let others propagate
    3. Structured: Can add custom attributes (code, details)
    4. Consistent: Ensures same format everywhere
    
    Example:
        try:
            country = fetch_country(iso3)
        except APIError as e:
            return e.to_response()  # Convert to Flask response
        except Exception as e:
            # Unexpected error - don't expose details
            return APIError('Internal server error', 500).to_response()
    
    Attributes:
        message (str): User-friendly error message
        code (int): HTTP status code (400, 404, 500, etc.)
        details (dict): Additional context for debugging
        timestamp (str): ISO 8601 timestamp when error occurred
    """

    def __init__(self, message: str, code: int = 500, details: dict = None):
        """
        Initialize APIError with standardized fields.
        
        Args:
            message: User-friendly error description
            code: HTTP status code (defaults to 500 Internal Server Error)
            details: Optional dictionary with debugging information
                     Examples: {'endpoint': '/api/countries', 'iso3': 'USA'}
        """
        self.message = message
        self.code = code
        self.details = details or {}
        self.timestamp = datetime.utcnow().isoformat()
        super().__init__(self.message)

    def to_response(self):
        """
        Convert error to Flask response tuple.
        
        INTERVIEW PREP: Flask Response Tuples
        ====================================
        Flask route handlers return (data, status_code) tuples.
        This method provides that format.
        
        Example:
            @app.route('/countries')
            def get_countries():
                try:
                    data = fetch_countries()
                    return {'countries': data}, 200
                except APIError as e:
                    return e.to_response()  # Returns error dict + status
        
        Returns:
            tuple: (error_dict, http_status_code)
            
        The returned dict format:
            {
                'error': 'Human-readable message',
                'code': 404,
                'details': {'endpoint': '/countries', ...},
                'timestamp': '2025-12-18T12:34:56.789012'
            }
        
        Frontend receives structured error it can parse and display.
        """
        return {
            'error': self.message,
            'code': self.code,
            'details': self.details,
            'timestamp': self.timestamp
        }, self.code

    def __str__(self):
        """String representation for logging."""
        return f"APIError({self.code}): {self.message}"


class ValidationError(APIError):
    """
    Error for invalid input data (HTTP 400 Bad Request).
    
    Use when:
    - Missing required fields
    - Invalid data format
    - Out-of-range values
    
    Example:
        if not iso3:
            raise ValidationError('iso3 parameter required', 
                                details={'received': iso3})
    """
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, code=400, details=details)


class NotFoundError(APIError):
    """
    Error when resource doesn't exist (HTTP 404 Not Found).
    
    Use when:
    - Country not in database
    - Image file missing
    - Endpoint doesn't exist
    
    Example:
        country = db.query_country(iso3)
        if not country:
            raise NotFoundError(f'Country {iso3} not found',
                              details={'iso3': iso3})
    """
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, code=404, details=details)


class ConflictError(APIError):
    """
    Error for state conflicts (HTTP 409 Conflict).
    
    Use when:
    - Trying to create duplicate entry
    - Resource already exists
    - Operation conflicts with current state
    
    Example:
        if country_exists(iso3):
            raise ConflictError(f'Country {iso3} already exists')
    """
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, code=409, details=details)


class InternalError(APIError):
    """
    Error for internal server errors (HTTP 500 Internal Server Error).
    
    Use when:
    - Database connection fails
    - Unexpected exception occurred
    - External service unavailable
    
    SECURITY NOTE: Don't expose implementation details to users.
    Example:
        except DatabaseError as e:
            # Log the real error for debugging
            logger.error(f'Database failed: {str(e)}')
            # But return generic message to user
            raise InternalError('Unable to process request',
                              details={'error_type': 'database'})
    """
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, code=500, details=details)


class ExternalServiceError(APIError):
    """
    Error when external service fails (HTTP 502/503).
    
    Use when:
    - Image download fails
    - External API times out
    - Third-party service unavailable
    
    Example:
        try:
            image = download_from_met_api(object_id)
        except requests.Timeout:
            raise ExternalServiceError('Met API timeout',
                                      details={'service': 'met', 'object_id': object_id})
    """
    def __init__(self, message: str, details: dict = None, code: int = 502):
        super().__init__(message, code=code, details=details)


def handle_api_error(error):
    """
    Flask error handler for APIError exceptions.
    
    Register this with Flask to automatically convert APIError
    to proper JSON responses.
    
    INTERVIEW PREP: Flask Error Handlers
    ====================================
    Flask allows registering error handlers for specific exceptions.
    When that exception is raised in a route, the handler is called.
    
    Usage in app.py:
        from error_handler import APIError, handle_api_error
        
        app = Flask(__name__)
        app.register_error_handler(APIError, handle_api_error)
    
    Now any route can:
        @app.route('/api/countries')
        def get_countries():
            try:
                return {'countries': fetch()}, 200
            except APIError as e:
                # Flask automatically calls handle_api_error(e)
                # and converts it to JSON response
                raise
    
    Args:
        error: The APIError instance
        
    Returns:
        tuple: (response_dict, status_code)
    """
    return error.to_response()


# ========================
# Example Usage
# ========================

"""
How to use in Flask routes:

from error_handler import APIError, ValidationError, NotFoundError, handle_api_error

app = Flask(__name__)
app.register_error_handler(APIError, handle_api_error)

@app.route('/api/images/<iso3>')
def get_images(iso3):
    # Validation errors
    if not iso3 or len(iso3) != 3:
        raise ValidationError(
            'iso3 must be 3-letter country code',
            details={'received': iso3, 'expected_length': 3}
        )
    
    # Not found errors
    country = db.query_country(iso3)
    if not country:
        raise NotFoundError(
            f'Country {iso3} not found',
            details={'iso3': iso3, 'available_countries': 249}
        )
    
    # Internal errors
    try:
        images = fetch_images_from_database(iso3)
    except DatabaseError as e:
        raise InternalError(
            'Failed to fetch images',
            details={'iso3': iso3, 'error_type': 'database'}
        )
    
    return {'images': images}, 200


Frontend receives consistent response:
{
    "error": "Country USA not found",
    "code": 404,
    "details": {"iso3": "USA", "available_countries": 249},
    "timestamp": "2025-12-18T12:34:56.789012"
}
"""
