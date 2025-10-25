from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class Vote(Base):
    __tablename__ = "votes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    poll_id = Column(Integer, ForeignKey("polls.id"), nullable=False)
    option_id = Column(Integer, ForeignKey("poll_options.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="votes")
    option = relationship("PollOption", back_populates="votes")
    
    # Unique constraint: one vote per user per poll
    __table_args__ = (UniqueConstraint('user_id', 'poll_id', name='_user_poll_uc'),)

class Like(Base):
    __tablename__ = "likes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    poll_id = Column(Integer, ForeignKey("polls.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="likes")
    poll = relationship("Poll", back_populates="likes")
    
    # Unique constraint: one like per user per poll
    __table_args__ = (UniqueConstraint('user_id', 'poll_id', name='_user_poll_like_uc'),)
