from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List
from ..database import get_db
from ..models.user import User
from ..models.poll import Poll, PollOption
from ..models.vote import Vote, Like
from ..schemas.poll import PollCreate, PollResponse, VoteCreate, PollOptionResponse
from ..services.auth import get_current_user
from ..services.websocket import manager
from ..utils.validators import validate_id

router = APIRouter(prefix="/api/polls", tags=["polls"])

def get_poll_response(poll: Poll, user: User, db: Session) -> dict:
    """Helper to format poll response with vote counts and user interaction"""
    # Get vote counts per option
    vote_counts = db.query(
        PollOption.id,
        func.count(Vote.id).label('count')
    ).outerjoin(Vote).filter(
        PollOption.poll_id == poll.id
    ).group_by(PollOption.id).all()
    
    vote_count_dict = {vc[0]: vc[1] for vc in vote_counts}
    
    # Get user's vote if exists
    user_vote = db.query(Vote).filter(
        Vote.poll_id == poll.id,
        Vote.user_id == user.id
    ).first() if user else None
    
    # Get user's like if exists
    user_like = db.query(Like).filter(
        Like.poll_id == poll.id,
        Like.user_id == user.id
    ).first() if user else None
    
    # Get total likes
    like_count = db.query(func.count(Like.id)).filter(
        Like.poll_id == poll.id
    ).scalar()
    
    # Format options with vote counts
    options = []
    for option in sorted(poll.options, key=lambda x: x.order):
        options.append({
            "id": option.id,
            "text": option.text,
            "order": option.order,
            "vote_count": vote_count_dict.get(option.id, 0)
        })
    
    total_votes = sum(opt['vote_count'] for opt in options)
    
    return {
        "id": poll.id,
        "title": poll.title,
        "description": poll.description,
        "creator_id": poll.creator_id,
        "creator_username": poll.creator.username,
        "is_active": poll.is_active,
        "created_at": poll.created_at,
        "options": options,
        "total_votes": total_votes,
        "like_count": like_count,
        "user_voted": user_vote is not None,
        "user_liked": user_like is not None,
        "user_vote_option_id": user_vote.option_id if user_vote else None
    }

@router.post("/", response_model=PollResponse, status_code=status.HTTP_201_CREATED)
async def create_poll(
    poll_data: PollCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Create poll
    new_poll = Poll(
        title=poll_data.title,
        description=poll_data.description,
        creator_id=current_user.id
    )
    db.add(new_poll)
    db.flush()
    
    # Create options
    for idx, option in enumerate(poll_data.options):
        poll_option = PollOption(
            poll_id=new_poll.id,
            text=option.text,
            order=idx
        )
        db.add(poll_option)
    
    db.commit()
    db.refresh(new_poll)
    
    return get_poll_response(new_poll, current_user, db)

@router.get("/", response_model=List[PollResponse])
async def get_polls(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    polls = db.query(Poll).filter(
        Poll.is_active == True
    ).order_by(desc(Poll.created_at)).offset(skip).limit(limit).all()
    
    return [get_poll_response(poll, current_user, db) for poll in polls]

@router.get("/{poll_id}", response_model=PollResponse)
async def get_poll(
    poll_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    poll_id = validate_id(poll_id, "Poll ID")
    
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poll not found"
        )
    
    return get_poll_response(poll, current_user, db)

@router.post("/{poll_id}/vote", response_model=PollResponse)
async def vote_on_poll(
    poll_id: int,
    vote_data: VoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    poll_id = validate_id(poll_id, "Poll ID")
    
    # Check poll exists
    poll = db.query(Poll).filter(Poll.id == poll_id, Poll.is_active == True).first()
    if not poll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poll not found"
        )
    
    # Check option belongs to poll
    option = db.query(PollOption).filter(
        PollOption.id == vote_data.option_id,
        PollOption.poll_id == poll_id
    ).first()
    
    if not option:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid option for this poll"
        )
    
    # Check if user already voted
    existing_vote = db.query(Vote).filter(
        Vote.user_id == current_user.id,
        Vote.poll_id == poll_id
    ).first()
    
    if existing_vote:
        # Update vote
        existing_vote.option_id = vote_data.option_id
    else:
        # Create new vote
        new_vote = Vote(
            user_id=current_user.id,
            poll_id=poll_id,
            option_id=vote_data.option_id
        )
        db.add(new_vote)
    
    db.commit()
    
    # Broadcast update via WebSocket
    poll_data = get_poll_response(poll, current_user, db)
    await manager.broadcast_to_poll(poll_id, {
        "type": "vote_update",
        "data": poll_data
    })
    
    return poll_data

@router.post("/{poll_id}/like", response_model=PollResponse)
async def toggle_like(
    poll_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    poll_id = validate_id(poll_id, "Poll ID")
    
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poll not found"
        )
    
    # Check if user already liked
    existing_like = db.query(Like).filter(
        Like.user_id == current_user.id,
        Like.poll_id == poll_id
    ).first()
    
    if existing_like:
        # Unlike
        db.delete(existing_like)
    else:
        # Like
        new_like = Like(
            user_id=current_user.id,
            poll_id=poll_id
        )
        db.add(new_like)
    
    db.commit()
    
    # Broadcast update via WebSocket
    poll_data = get_poll_response(poll, current_user, db)
    await manager.broadcast_to_poll(poll_id, {
        "type": "like_update",
        "data": poll_data
    })
    
    return poll_data

@router.delete("/{poll_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_poll(
    poll_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    poll_id = validate_id(poll_id, "Poll ID")
    
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poll not found"
        )
    
    if poll.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this poll"
        )
    
    db.delete(poll)
    db.commit()
    
    return None
