import re
import html
from typing import Optional


class InputSanitizer:
    """Input sanitization and validation utilities"""

    @staticmethod
    def sanitize_string(value: str, max_length: int = 255) -> str:
        """
        Sanitize string input:
        - Strip whitespace
        - HTML escape
        - Limit length
        """
        if not value:
            return ""

        # Strip whitespace
        sanitized = value.strip()

        # HTML escape to prevent XSS
        sanitized = html.escape(sanitized)

        # Limit length
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length]

        return sanitized

    @staticmethod
    def sanitize_phone(phone: str) -> str:
        """
        Sanitize phone number:
        - Remove non-digit characters except '+'
        - Validate format
        """
        if not phone:
            raise ValueError("Phone number is required")

        # Remove all characters except digits and '+'
        sanitized = re.sub(r'[^\d+]', '', phone)

        # Validate Ukrainian phone format
        if not re.match(r'^\+380\d{9}$', sanitized):
            raise ValueError("Invalid phone number format. Expected: +380XXXXXXXXX")

        return sanitized

    @staticmethod
    def sanitize_email(email: str) -> Optional[str]:
        """
        Sanitize email:
        - Convert to lowercase
        - Validate format
        - HTML escape
        """
        if not email:
            return None

        # Convert to lowercase and strip
        sanitized = email.lower().strip()

        # Basic email validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, sanitized):
            raise ValueError("Invalid email format")

        # HTML escape
        sanitized = html.escape(sanitized)

        if len(sanitized) > 255:
            raise ValueError("Email too long")

        return sanitized

    @staticmethod
    def sanitize_name(name: str) -> str:
        """
        Sanitize name:
        - Remove non-alphabetic characters (except spaces, hyphens, apostrophes)
        - Limit length
        - Capitalize properly
        """
        if not name:
            raise ValueError("Name is required")

        # Allow only letters, spaces, hyphens, apostrophes, and Cyrillic
        sanitized = re.sub(r'[^a-zA-Zа-яА-ЯіІїЇєЄґҐ\s\-\']', '', name.strip())

        if not sanitized:
            raise ValueError("Invalid name format")

        # Limit length
        if len(sanitized) > 100:
            sanitized = sanitized[:100]

        # Capitalize words
        sanitized = ' '.join(word.capitalize() for word in sanitized.split())

        # HTML escape
        sanitized = html.escape(sanitized)

        return sanitized

    @staticmethod
    def sanitize_notes(notes: str, max_length: int = 1000) -> Optional[str]:
        """
        Sanitize notes/textarea content:
        - Strip whitespace
        - HTML escape
        - Limit length
        - Remove potentially dangerous patterns
        """
        if not notes:
            return None

        # Strip whitespace
        sanitized = notes.strip()

        # Remove script tags and other dangerous patterns
        dangerous_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript:',
            r'on\w+\s*=',
        ]

        for pattern in dangerous_patterns:
            sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE | re.DOTALL)

        # HTML escape
        sanitized = html.escape(sanitized)

        # Limit length
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length]

        return sanitized if sanitized else None

    @staticmethod
    def validate_date_range(from_date, to_date):
        """Validate date range"""
        if from_date and to_date and from_date > to_date:
            raise ValueError("'from_date' cannot be after 'to_date'")

    @staticmethod
    def sanitize_sql_like(value: str) -> str:
        """
        Sanitize value for SQL LIKE queries:
        - Escape special characters
        """
        if not value:
            return ""

        # Escape SQL LIKE special characters
        sanitized = value.replace('\\', '\\\\')
        sanitized = sanitized.replace('%', '\\%')
        sanitized = sanitized.replace('_', '\\_')

        return sanitized


# Create global instance
sanitizer = InputSanitizer()
