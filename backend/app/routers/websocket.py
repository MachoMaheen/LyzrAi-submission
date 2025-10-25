from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.websocket import manager
from ..utils.security import decode_access_token
from ..utils.validators import validate_id

router = APIRouter(tags=["websocket"])

@router.websocket("/ws/polls/{poll_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    poll_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    # Validate token
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=1008)
        return
    
    poll_id = validate_id(poll_id, "Poll ID")
    
    await manager.connect(websocket, poll_id)
    
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            
            # Handle ping/pong
            if data == "ping":
                await websocket.send_text("pong")
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, poll_id)
