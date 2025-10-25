import re
from typing import Any
from fastapi import HTTPException, status

def sanitize_string(value: str) -> str:
    """Remove potentially dangerous characters"""
    # Remove null bytes and control characters
    sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', value)
    return sanitized.strip()

def validate_id(id_value: Any, field_name: str = "ID") -> int:
    """Validate and convert ID to integer"""
    try:
        id_int = int(id_value)
        if id_int < 1:
            raise ValueError
        return id_int
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name}"
        )
