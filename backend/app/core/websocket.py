from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """WebSocket connection manager for real-time updates"""

    def __init__(self):
        # Store active connections by type
        self.active_connections: Dict[str, List[WebSocket]] = {
            "admin": [],
            "user": []
        }

    async def connect(self, websocket: WebSocket, client_type: str = "user"):
        """Accept and store a new WebSocket connection"""
        await websocket.accept()
        if client_type not in self.active_connections:
            self.active_connections[client_type] = []
        self.active_connections[client_type].append(websocket)
        logger.info(f"New {client_type} WebSocket connection. Total: {len(self.active_connections[client_type])}")

    def disconnect(self, websocket: WebSocket, client_type: str = "user"):
        """Remove a WebSocket connection"""
        if client_type in self.active_connections:
            if websocket in self.active_connections[client_type]:
                self.active_connections[client_type].remove(websocket)
                logger.info(f"{client_type} WebSocket disconnected. Remaining: {len(self.active_connections[client_type])}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific client"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")

    async def broadcast(self, message: dict, client_type: str = "all"):
        """Broadcast a message to all connected clients of a type"""
        if client_type == "all":
            targets = []
            for connections in self.active_connections.values():
                targets.extend(connections)
        else:
            targets = self.active_connections.get(client_type, [])

        disconnected = []
        for connection in targets:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected.append(connection)

        # Clean up disconnected clients
        for connection in disconnected:
            for conn_type, connections in self.active_connections.items():
                if connection in connections:
                    connections.remove(connection)

    async def notify_appointment_created(self, appointment_data: dict):
        """Notify about new appointment"""
        message = {
            "type": "appointment_created",
            "data": appointment_data
        }
        await self.broadcast(message, "admin")

    async def notify_appointment_cancelled(self, appointment_id: int):
        """Notify about cancelled appointment"""
        message = {
            "type": "appointment_cancelled",
            "data": {"appointment_id": appointment_id}
        }
        await self.broadcast(message, "admin")

    async def notify_slots_updated(self):
        """Notify that available slots have changed"""
        message = {
            "type": "slots_updated",
            "data": {"message": "Available slots have been updated"}
        }
        await self.broadcast(message, "user")

    async def notify_user_blacklisted(self, user_phone: str):
        """Notify specific user about blacklist status"""
        message = {
            "type": "user_blacklisted",
            "data": {"message": "Your account has been restricted"}
        }
        # In a real implementation, you'd track user connections by phone
        await self.broadcast(message, "user")


# Global connection manager instance
manager = ConnectionManager()
