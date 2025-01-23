# schemas.py

from datetime import datetime
from pydantic import BaseModel, field_validator, validator
from typing import Optional, List


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    profile_image: Optional[str] = None


class UpdateUserProfile(BaseModel):
    username: str
    email: str
    profile_image: str  # Base64 кодированное изображение


class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    profile_image: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True


class UserInDB(UserResponse):
    hashed_password: str


class NotificationBase(BaseModel):
    title: str
    description: str
    link: str


class NotificationResponse(NotificationBase):
    id: int
    date: Optional[datetime] = None

    def __init__(self, **data):
        super().__init__(**data)
        if not self.date:
            self.date = datetime.now()

    class Config:
        orm_mode = True


class ChatMessageSchema(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    message: str
    timestamp: datetime

    class Config:
        orm_mode = True

