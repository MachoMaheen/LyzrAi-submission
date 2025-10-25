from fastapi import WebSocket
from typing import Dict, Set
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, poll_id: int):
        await websocket.accept()
        if poll_id not in self.active_connections:
            self.active_connections[poll_id] = set()
        self.active_connections[poll_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, poll_id: int):
        if poll_id in self.active_connections:
            self.active_connections[poll_id].discard(websocket)
            if not self.active_connections[poll_id]:
                del self.active_connections[poll_id]
    
    async def broadcast_to_poll(self, poll_id: int, message: dict):
        if poll_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[poll_id]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.add(connection)
            
            # Remove disconnected clients
            for connection in disconnected:
                self.active_connections[poll_id].discard(connection)

manager = ConnectionManager()
