# models.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, UniqueConstraint, ARRAY, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime


Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    profile_image = Column(String, nullable=True)  # profile image
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now)


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String)
    description = Column(String)
    link = Column(String)
    date = Column(DateTime, default=datetime.now)

    user = relationship("User")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    message = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.now)

    sender = relationship("User", foreign_keys=[sender_id])  # Связь с отправителем
    recipient = relationship("User", foreign_keys=[recipient_id])  # Связь с получателем

