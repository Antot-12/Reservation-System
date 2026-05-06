from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.websocket import manager
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websocket"])


@router.websocket("/user")
async def websocket_user_endpoint(websocket: WebSocket, phone: str = Query(None)):
    """WebSocket endpoint for user real-time updates"""
    await manager.connect(websocket, "user")

    try:
        # Send initial connection message
        await manager.send_personal_message({
            "type": "connection_established",
            "data": {"message": "Connected to real-time updates"}
        }, websocket)

        # Keep connection alive and handle incoming messages
        while True:
            data = await websocket.receive_text()
            # Echo back for heartbeat/testing
            await manager.send_personal_message({
                "type": "echo",
                "data": {"message": data}
            }, websocket)

    except WebSocketDisconnect:
        manager.disconnect(websocket, "user")
        logger.info("User WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, "user")


@router.websocket("/admin")
async def websocket_admin_endpoint(websocket: WebSocket, token: str = Query(None)):
    """WebSocket endpoint for admin real-time updates"""
    # TODO: Verify admin token here

    await manager.connect(websocket, "admin")

    try:
        # Send initial connection message
        await manager.send_personal_message({
            "type": "connection_established",
            "data": {"message": "Connected to admin updates"}
        }, websocket)

        # Keep connection alive and handle incoming messages
        while True:
            data = await websocket.receive_text()
            # Echo back for heartbeat/testing
            await manager.send_personal_message({
                "type": "echo",
                "data": {"message": data}
            }, websocket)

    except WebSocketDisconnect:
        manager.disconnect(websocket, "admin")
        logger.info("Admin WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, "admin")
