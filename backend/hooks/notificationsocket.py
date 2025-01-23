from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from jwt import decode, exceptions as jwt_exceptions
from typing import List
from auth.auth_handler import SECRET_KEY, ALGORITHM
from models import User, Notification
from database import get_session
from settings.logging_config import logger

router = APIRouter()

active_connections: List[WebSocket] = []


async def notify_users_update():
    logger.info("Notifying clients about updates")
    disconnected_clients = []
    for connection in active_connections:
        try:
            logger.debug(f"Sending notification to {connection}")
            await connection.send_json({"update": True})
        except Exception as e:
            logger.error(f"Failed to notify client: {e}")
            disconnected_clients.append(connection)

    for client in disconnected_clients:
        active_connections.remove(client)
        logger.warning(f"Removed disconnected client. Remaining: {len(active_connections)}")




def get_current_user_from_token(token: str, db: Session):
    """
    Проверить и декодировать токен, получить текущего пользователя.
    """
    try:
        payload = decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt_exceptions.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str):
    await websocket.accept()
    active_connections.append(websocket)
    logger.info(f"Client connected. Active connections: {len(active_connections)}")
    try:
        while True:
            await websocket.receive_text()  # Ожидание сообщений от клиента
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        logger.warning(f"Client disconnected. Active connections: {len(active_connections)}")


