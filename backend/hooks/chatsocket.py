from datetime import datetime, timedelta
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from redis.asyncio import Redis
import json

from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_session
from models import ChatMessage, User
from settings.logging_config import logger
import base64
from settings.config import settings

router = APIRouter()
redis_url = settings.REDIS_URL
# Подключение к Redis
redis = Redis.from_url(redis_url, decode_responses=True)


async def test_redis_connection():
    redis = Redis.from_url(redis_url, decode_responses=True)
    try:
        # Выполнение команды PING
        pong = await redis.ping()
        if pong:
            print("Connected to Redis successfully!")
    except Exception as e:
        print(f"Failed to connect to Redis: {e}")
    finally:
        # Закрываем соединение
        await redis.close()

# Менеджер соединений
class ConnectionManager:
    def __init__(self):
        # Хранение подключений по пользователям
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        # Сохраняем соединение WebSocket с привязкой к user_id
        await websocket.accept()
        self.active_connections[user_id] = websocket
        websocket.user_id = user_id  # Добавляем атрибут user_id в объект WebSocket

    async def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_private_message(self, recipient: str, message: str):
        try:
            await self.active_connections[recipient].send_text(message)
        except:
            logger.error('User not logged')

    def get_active_connections_count(self):
        """Возвращает количество активных подключений."""
        return len(self.active_connections)


manager = ConnectionManager()


async def update_last_message_timestamp(sender_id, recipient_id):
    # Формируем ключ для хранения времени последнего сообщения
    timestamp_key = f"last_message_timestamp:{sender_id}:{recipient_id}"
    timestamp = datetime.now().isoformat()

    # Записываем время последнего сообщения в Redis
    await redis.set(timestamp_key, timestamp)

    # Логирование для отладки
    logger.info(f"Updated last message timestamp for {sender_id} <-> {recipient_id}: {timestamp}")

# Функция для обновления контактных списков
async def update_contact_list(sender_id, recipient_id):
    # Формируем ключи для списка контактов
    sender_contacts_key = f"contacts:{sender_id}"
    recipient_contacts_key = f"contacts:{recipient_id}"

    # Добавляем получателя в список контактов отправителя
    await redis.sadd(sender_contacts_key, recipient_id)

    # Добавляем отправителя в список контактов получателя
    await redis.sadd(recipient_contacts_key, sender_id)

    # Логирование для отладки
    logger.info(f"Updated contact lists: {sender_id} <-> {recipient_id}")


async def mark_messages_as_read(user_id, chat_id):
    chat_key = f"chat:{':'.join(sorted([str(user_id), str(chat_id)]))}"
    message_status_key = f"message_status:{chat_key}"

    # Загружаем сообщения из Redis
    messages = await redis.lrange(message_status_key, 0, -1)

    updated_messages = []
    read_timestamps = []  # Список временных меток прочитанных сообщений
    for msg in messages:
        msg_data = json.loads(msg)
        if not msg_data.get("read", False) and msg_data.get("sender_id") != user_id:
            msg_data["read"] = True
            read_timestamps.append(msg_data["timestamp"])  # Сохраняем метку времени
        updated_messages.append(json.dumps(msg_data))

    # Перезаписываем обновленные данные в Redis
    await redis.delete(message_status_key)
    for msg in updated_messages:
        await redis.rpush(message_status_key, msg)

    logger.info(f"Marked messages as read for chat {chat_key}")

    return read_timestamps  # Возвращаем временные метки прочитанных сообщений




async def handle_message(data, user_id):
    recipient_id = str(data["recipient_id"])
    message = data["message"]
    timestamp = datetime.now().isoformat()

    msg_data = {
        "type": "message",
        "sender_id": user_id,
        "recipient_id": recipient_id,
        "message": message,
        "timestamp": timestamp,
        "read": False,
    }

    chat_key = f"chat:{':'.join(sorted([user_id, recipient_id]))}"
    await redis.rpush(chat_key, json.dumps(msg_data))

    # Сохраняем статус сообщения в `message_status`
    message_status_key = f"message_status:{chat_key}"
    await redis.rpush(message_status_key, json.dumps({
        "timestamp": timestamp,
        "read": False,
        "sender_id": user_id
    }))

    # Увеличиваем `unread` только для получателя
    if recipient_id != user_id:  # Исключаем отправителя
        unread_key = f"unread_count:{recipient_id}:{user_id}"
        await redis.incr(unread_key)

    # Обновляем время последнего сообщения для пары
    await update_last_message_timestamp(user_id, recipient_id)
    await update_last_message_timestamp(recipient_id, user_id)

    # Если получатель в сети, отправляем сообщение
    await manager.send_private_message(recipient_id, json.dumps(msg_data))
    await manager.send_private_message(user_id, json.dumps(msg_data))

    await update_contact_list(user_id, recipient_id)
    await update_contact_list(recipient_id, user_id)

    await update_last_message(user_id, recipient_id, message, timestamp)
    await update_last_message(recipient_id, user_id, message, timestamp)


async def update_last_message(sender_id, recipient_id, message, timestamp):
    last_message_key = f"last_message:{sender_id}:{recipient_id}"
    await redis.set(last_message_key, json.dumps({
        "message": message,
        "timestamp": timestamp
    }))
    logger.info(f"Updated last message for {sender_id} <-> {recipient_id}")


async def handle_reply(data, user_id):
    recipient_id = str(data["recipient_id"])
    message = data["message"]  # Основное сообщение
    reply = data["reply"]  # Текст, на который пользователь отвечает
    timestamp = datetime.now().isoformat()

    # Формируем данные для сообщения-ответа
    reply_msg_data = {
        "type": "reply",
        "sender_id": user_id,
        "recipient_id": recipient_id,
        "message": message,
        "reply": reply,
        "timestamp": timestamp,
        "read": False,
    }

    # Ключ чата в Redis
    chat_key = f"chat:{':'.join(sorted([user_id, recipient_id]))}"
    await redis.rpush(chat_key, json.dumps(reply_msg_data))

    # Сохраняем статус сообщения
    message_status_key = f"message_status:{chat_key}"
    await redis.rpush(message_status_key, json.dumps({
        "timestamp": timestamp,
        "read": False,
        "sender_id": user_id
    }))

    # Увеличиваем `unread` только для получателя
    if recipient_id != user_id:  # Исключаем отправителя
        unread_key = f"unread_count:{recipient_id}:{user_id}"
        await redis.incr(unread_key)

    # Обновляем время последнего сообщения
    await update_last_message_timestamp(user_id, recipient_id)
    await update_last_message_timestamp(recipient_id, user_id)

    # Отправляем сообщение получателю и отправителю
    await manager.send_private_message(recipient_id, json.dumps(reply_msg_data))
    await manager.send_private_message(user_id, json.dumps(reply_msg_data))

    # Обновляем списки контактов
    await update_contact_list(user_id, recipient_id)
    await update_contact_list(recipient_id, user_id)

    # Обновляем последнее сообщение
    await update_last_message(user_id, recipient_id, message, timestamp)
    await update_last_message(recipient_id, user_id, message, timestamp)

async def handle_image(data, user_id):
    recipient_id = str(data["recipient_id"])
    image_base64 = data["image"]  # Получаем Base64 строку изображения
    image_data = base64.b64decode(image_base64)  # Декодируем Base64

    timestamp = datetime.now().isoformat()

    # Создаем сообщение с изображением
    msg_data = {
        "type": "image",
        "sender_id": user_id,
        "recipient_id": recipient_id,
        "image": image_base64,  # Отправляем изображение в формате Base64
        "timestamp": timestamp,
        "read": False,
    }

    chat_key = f"chat:{':'.join(sorted([user_id, recipient_id]))}"
    await redis.rpush(chat_key, json.dumps(msg_data))

    # Сохраняем статус сообщения
    message_status_key = f"message_status:{chat_key}"
    await redis.rpush(message_status_key, json.dumps({
        "timestamp": timestamp,
        "read": False,
        "sender_id": user_id
    }))

    # Увеличиваем `unread` только для получателя
    if recipient_id != user_id:  # Исключаем отправителя
        unread_key = f"unread_count:{recipient_id}:{user_id}"
        await redis.incr(unread_key)

    # Обновляем время последнего сообщения для пары
    await update_last_message_timestamp(user_id, recipient_id)
    await update_last_message_timestamp(recipient_id, user_id)

    # Если получатель в сети, отправляем сообщение
    await manager.send_private_message(recipient_id, json.dumps(msg_data))
    await manager.send_private_message(user_id, json.dumps(msg_data))

    await update_contact_list(user_id, recipient_id)
    await update_contact_list(recipient_id, user_id)

    await update_last_message(user_id, recipient_id, "Изображение", timestamp)
    await update_last_message(recipient_id, user_id, "Изображение", timestamp)


async def handle_history_request(websocket, data, user_id):
    recipient_id = int(data["recipient_id"])
    chat_key = f"chat:{':'.join(sorted([str(user_id), str(recipient_id)]))}"
    message_status_key = f"message_status:{chat_key}"

    # Количество сообщений для загрузки
    messages_to_load = 20
    last_timestamp = data.get("last_timestamp", None)

    # Загружаем сообщения из Redis
    redis_messages = await redis.lrange(chat_key, 0, -1)  # Все сообщения
    redis_statuses = await redis.lrange(message_status_key, 0, -1)  # Все статусы

    # Преобразуем статусы в словарь для быстрого доступа
    status_dict = {}
    for status in redis_statuses:
        status_data = json.loads(status)
        status_dict[status_data["timestamp"]] = status_data.get("read", False)

    # Обрабатываем сообщения
    redis_messages = [json.loads(msg) for msg in redis_messages]
    if last_timestamp:
        # Фильтруем сообщения по временной метке
        redis_messages = [
            msg for msg in redis_messages if msg["timestamp"] < last_timestamp
        ]
        # Ограничиваем количество
        redis_messages = redis_messages[-messages_to_load:]
    else:
        # Берем последние N сообщений
        redis_messages = redis_messages[-messages_to_load:]

    # Добавляем статус `read` к каждому сообщению
    for msg in redis_messages:
        msg["read"] = status_dict.get(msg["timestamp"], False)

    # Сортируем сообщения по временной метке
    redis_messages = sorted(redis_messages, key=lambda x: x["timestamp"])

    # Отправляем сообщения клиенту
    await websocket.send_text(json.dumps({"type": "history_response", "messages": redis_messages}))

async def get_user_status(user_id: str) -> str:
    """Получить статус пользователя из Redis."""
    status_key = f"user_status:{user_id}"
    status = await redis.get(status_key)
    return status or "offline"


async def update_last_seen(user_id: str):
    """Сохранить время последней активности пользователя."""
    last_seen_key = f"user_last_seen:{user_id}"
    timestamp = datetime.now().isoformat()  # ISO 8601 формат
    await redis.set(last_seen_key, timestamp)


async def get_last_seen(user_id: str) -> str:
    """Получить время последней активности пользователя."""
    last_seen_key = f"user_last_seen:{user_id}"
    timestamp = await redis.get(last_seen_key)
    return timestamp or "Неизвестно"  # Если данные отсутствуют


async def set_user_status(user_id: str, status: str):
    """Установить статус пользователя в Redis."""
    status_key = f"user_status:{user_id}"
    await redis.set(status_key, status)
    await redis.expire(status_key, 60)  # 1 минута (для автоматической проверки активности)


async def handle_delete_message(message_id, chat_id, user_id):
    chat_key = f"chat:{':'.join(sorted([str(user_id), str(chat_id)]))}"
    message_status_key = f"message_status:{chat_key}"

    # Загружаем сообщения из Redis
    messages = await redis.lrange(chat_key, 0, -1)

    updated_messages = [
        msg for msg in messages if json.loads(msg).get("timestamp") != message_id
    ]

    # Перезаписываем чат без удаленного сообщения
    await redis.delete(chat_key)
    for msg in updated_messages:
        await redis.rpush(chat_key, msg)

    # Обновляем статусы сообщений
    message_statuses = await redis.lrange(message_status_key, 0, -1)
    updated_statuses = [
        status for status in message_statuses if json.loads(status).get("timestamp") != message_id
    ]
    await redis.delete(message_status_key)
    for status in updated_statuses:
        await redis.rpush(message_status_key, status)

    # Уведомляем участников чата об удалении
    message_data = {
        "type": "delete_message",
        "message_id": message_id,
        "chat_id": chat_id,
    }

    # Отправляем уведомление отправителю
    sender_websocket = manager.active_connections.get(str(user_id))
    if sender_websocket:
        await sender_websocket.send_text(json.dumps(message_data))

    # Отправляем уведомление получателю
    recipient_websocket = manager.active_connections.get(str(chat_id))
    if recipient_websocket:
        await recipient_websocket.send_text(json.dumps(message_data))

    logger.info(f"Deleted message {message_id} in chat {chat_key}")


async def notify_status_change(user_id: str, status: str):
    """
    Уведомляет подключенных пользователей о смене статуса только для тех, кто в списке контактов.
    """
    # Получаем список контактов текущего пользователя
    contacts_key = f"contacts:{user_id}"
    contact_ids = await redis.smembers(contacts_key)
    await update_last_seen(user_id)

    message = {
        "type": "status_update",
        "user_id": user_id,
        "status": status,
        "last_seen": datetime.now().isoformat() if status == "offline" else None,
    }

    # Отправляем сообщение только тем подключенным пользователям, которые есть в контактах
    for connection in manager.active_connections.values():
        # # Проверяем, является ли текущий пользователь контактом
        if connection.user_id in contact_ids:
            await connection.send_text(json.dumps(message))



async def handle_contact_list_request(websocket, db, user_id):
    # Формируем ключ контактов для текущего пользователя
    contacts_key = f"contacts:{user_id}"

    # Получаем все контакты из Redis
    contact_ids = await redis.smembers(contacts_key)

    # Логирование для отладки
    logger.info(f"Contacts for user {user_id}: {contact_ids}")

    # Если нет контактов, сразу отправляем пустой список
    if not contact_ids:
        await websocket.send_text(json.dumps({"type": "contact_list", "contacts": []}))
        return

    # Преобразуем contact_ids в список целых чисел
    contact_ids = list(map(int, contact_ids))

    try:
        # Получаем метки времени и тексты последних сообщений для каждого контакта
        last_message_timestamps = {}
        for contact_id in contact_ids:
            last_message_key = f"last_message:{user_id}:{contact_id}"
            last_message_data = await redis.get(last_message_key)

            if last_message_data:
                last_message_data = json.loads(last_message_data)
                last_message_timestamps[contact_id] = {
                    "message": last_message_data["message"],
                    "timestamp": last_message_data["timestamp"]
                }

        # Сортируем контакты по времени последнего сообщения
        sorted_contact_ids = sorted(contact_ids, key=lambda contact_id: last_message_timestamps.get(contact_id, {}).get("timestamp", '0'), reverse=True)
        logger.info(f"Sorted contact IDs: {sorted_contact_ids}")

        # Запрашиваем данные о пользователях из базы данных
        stmt = select(User).where(User.id.in_(sorted_contact_ids))
        result = await db.execute(stmt)
        contacts = result.scalars().all()


        contact_list = []
        for contact in contacts:
            contact_id = contact.id
            status = await get_user_status(contact_id)
            last_seen = await get_last_seen(contact_id) if status == "offline" else None

            # Получаем статусы сообщений из Redis
            message_status_key = f"message_status:chat:{':'.join(sorted([str(user_id), str(contact_id)]))}"
            messages = await redis.lrange(message_status_key, 0, -1)

            # Подсчитываем количество непрочитанных сообщений, отправленных другим пользователем
            unread_count = sum(
                1 for msg in messages
                if not json.loads(msg).get("read", False) and json.loads(msg).get("sender_id") != user_id
            )

            last_message_data = last_message_timestamps.get(contact_id, {})
            contact_list.append({
                "id": contact.id,
                "status": status,
                "last_seen": last_seen,
                "username": contact.username,
                "profile_image": contact.profile_image,
                "msg": last_message_data.get("message", ""),
                "time": last_message_data.get("timestamp", ""),
                "unread": unread_count  # Количество непрочитанных сообщений
            })

        contact_list_sorted = sorted(contact_list, key=lambda contact: sorted_contact_ids.index(contact['id']))
        # Логируем и отправляем контактный список пользователю
        #logger.info(f"Final contact list: {contact_list_sorted}")
        await websocket.send_text(json.dumps({"type": "contact_list", "contacts": contact_list_sorted}))

    except Exception as e:
        logger.error(f"Error fetching user data from PostgreSQL: {e}")
        await websocket.send_text(json.dumps({"error": "Failed to fetch contacts from the database"}))


async def notify_profile_update(user_id: str, updated_data: dict):
    """
    Уведомляет всех подключенных пользователей о том, что пользователь обновил свой профиль.
    """
    message = {
        "type": "profile_update",
        "user_id": user_id,
        "updated_data": updated_data,  # Здесь могут быть обновленные username, profile_image и т.д.
    }

    # Отправляем сообщение всем подключенным клиентам
    for connection in manager.active_connections.values():
        await connection.send_text(json.dumps(message))


async def handle_reaction(data, user_id):
    message_id = data["message_id"]
    reaction = data["reaction"]
    chat_id = data["chat_id"]

    chat_key = f"chat:{':'.join(sorted([str(user_id), str(chat_id)]))}"
    messages = await redis.lrange(chat_key, 0, -1)

    updated_messages = []
    for msg in messages:
        msg_data = json.loads(msg)
        if msg_data["timestamp"] == message_id:
            msg_data["reactions"] = msg_data.get("reactions", {})
            msg_data["reactions"][reaction] = msg_data["reactions"].get(reaction, 0) + 1
        updated_messages.append(json.dumps(msg_data))

    await redis.delete(chat_key)
    for msg in updated_messages:
        await redis.rpush(chat_key, msg)

    msg_data = {
        "type": "reaction_update",
        "message_id": message_id,
        "reaction": reaction,
        "chat_id": chat_id,
    }
    await manager.send_private_message(user_id, json.dumps(msg_data))
    await manager.send_private_message(chat_id, json.dumps(msg_data))


@router.websocket("/ws/chat/{user_id}")
async def chat_endpoint(websocket: WebSocket, user_id: int, db: AsyncSession = Depends(get_session)):

    user_id = str(user_id)
    await manager.connect(websocket, user_id)
    logger.info(f"User {user_id} connected. Active connections: {manager.get_active_connections_count()}")  # Без await
    await set_user_status(user_id, "online")
    await notify_status_change(user_id, "online")  # Уведомление о входе

    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received data from {user_id}: {data}")
            async with get_session() as db:

                try:
                    data = json.loads(data)
                except json.JSONDecodeError:
                    await websocket.send_text(json.dumps({"error": "Invalid JSON"}))
                    continue

                message_type = data.get("type")

                if message_type == "message":
                    await handle_message(data, user_id)

                elif message_type == "ping":
                    await set_user_status(user_id, "online")  # Удостоверимся, что статус актуален
                    await notify_status_change(user_id, "online")  # Уведомляем о статусе "online"

                elif message_type == "reply":
                    await handle_reply(data, user_id)  # Обработка реплаев

                elif message_type == "history_request":
                    await handle_history_request(websocket, data, user_id)

                elif message_type == "contact_list_request":
                    await handle_contact_list_request(websocket, db, user_id)

                elif message_type == "image":  # Обрабатываем изображение
                    await handle_image(data, user_id)
                    # Обработка запроса mark_as_read
                elif message_type == "mark_as_read":
                    chat_id = str(data["chat_id"])  # ID чата (ID отправителя)
                    read_timestamps = await mark_messages_as_read(user_id, chat_id)

                    # Уведомляем отправителя
                    sender_websocket = manager.active_connections.get(chat_id)
                    if sender_websocket:
                        await sender_websocket.send_text(json.dumps({
                            "type": "read_status_update",
                            "chat_id": user_id,  # ID пользователя, который прочитал
                            "timestamps": read_timestamps
                        }))

                    # Уведомляем текущего пользователя (обновить локальные данные)
                    recipient_websocket = manager.active_connections.get(user_id)
                    if recipient_websocket:
                        await recipient_websocket.send_text(json.dumps({
                            "type": "read_status_update",
                            "chat_id": chat_id,  # ID собеседника
                            "timestamps": read_timestamps
                        }))
                elif message_type == "delete_message":
                    message_id = data["message_id"]  # ID сообщения
                    chat_id = data["chat_id"]  # ID чата
                    await handle_delete_message(message_id, chat_id, user_id)

                elif message_type == "reaction":
                    await handle_reaction(data, user_id)

    except WebSocketDisconnect:
        await manager.disconnect(user_id)
        await set_user_status(user_id, "offline")
        await notify_status_change(user_id, "offline")  # Уведомление о выходе
        logger.info(f"User {user_id} disconnected")
    except Exception as e:
        logger.error(f"Error: {e}")
