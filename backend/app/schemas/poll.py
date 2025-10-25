from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import List

class PollOptionCreate(BaseModel):
    text: str
    
    @field_validator('text')
    @classmethod
    def validate_text(cls, v):
        if len(v.strip()) < 1 or len(v) > 255:
            raise ValueError('Option text must be between 1 and 255 characters')
        return v.strip()

class PollOptionResponse(BaseModel):
    id: int
    text: str
    order: int
    vote_count: int = 0
    
    class Config:
        from_attributes = True

class PollCreate(BaseModel):
    title: str
    description: str | None = None
    options: List[PollOptionCreate]
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        if len(v.strip()) < 5 or len(v) > 255:
            raise ValueError('Title must be between 5 and 255 characters')
        return v.strip()
    
    @field_validator('options')
    @classmethod
    def validate_options(cls, v):
        if len(v) < 2:
            raise ValueError('Poll must have at least 2 options')
        if len(v) > 10:
            raise ValueError('Poll cannot have more than 10 options')
        return v

class PollResponse(BaseModel):
    id: int
    title: str
    description: str | None
    creator_id: int
    creator_username: str
    is_active: bool
    created_at: datetime
    options: List[PollOptionResponse]
    total_votes: int = 0
    like_count: int = 0
    user_voted: bool = False
    user_liked: bool = False
    user_vote_option_id: int | None = None
    
    class Config:
        from_attributes = True

class VoteCreate(BaseModel):
    option_id: int
