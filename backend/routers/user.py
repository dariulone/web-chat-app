from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from auth.auth_handler import get_current_active_user
from sqlalchemy.future import select
from models import User, Notification
from schemas import UserResponse, NotificationBase, NotificationResponse, UpdateUserProfile
from database import get_session
from typing import List, Optional
from hooks.chatsocket import notify_profile_update
import asyncio

router = APIRouter()


asyncio.set_event_loop_policy(asyncio.DefaultEventLoopPolicy())


# Эндпоинт для получения текущего пользователя
@router.get("/users/me/", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        profile_image=current_user.profile_image
    )


# Эндпоинт для получения профиля пользователя по ID
@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_profile_by_id(
        user_id: int,
        current_user: Optional[User] = Depends(get_current_active_user),  # Сделано опциональным
        db: AsyncSession = Depends(get_session)
):
    # Запрос для поиска пользователя по ID
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email if current_user else None,
        profile_image=user.profile_image
    )


# Эндпоинт для получения профиля пользователя по username
@router.get("/get_users_by_username/{username}", response_model=UserResponse)
async def get_user_profile_by_username(
        username: str,
        current_user: Optional[User] = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_session)
):
    # Запрос для поиска пользователя по username
    result = await db.execute(select(User).filter(User.username == username))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email if current_user else None,
        profile_image=user.profile_image
    )


# Эндпоинт для обновления профиля пользователя
@router.put("/update/user/me", response_model=UpdateUserProfile)
async def update_user_profile(
    data: UpdateUserProfile,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session)
):
    # Запрос для поиска пользователя
    result = await db.execute(select(User).filter(User.id == current_user.id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Обновляем данные пользователя
    user.username = data.username
    user.email = data.email
    user.profile_image = data.profile_image

    # Сохраняем изменения в базе данных
    await db.commit()
    await db.refresh(user)

    # Уведомляем всех подключенных пользователей
    await notify_profile_update(str(current_user.id), {
        "username": user.username,
        "profile_image": user.profile_image,
        "email": user.email,
    })

    return user


# Эндпоинт для поиска пользователей по имени пользователя
@router.get("/search_user_by_username", response_model=List[UserResponse])
async def search_users(query: str, db: AsyncSession = Depends(get_session)):
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required")

    # Используем ilike для нечувствительного к регистру поиска
    stmt = select(User).filter(User.username.ilike(f"%{query}%"))
    result = await db.execute(stmt)
    users = result.scalars().all()

    if not users:
        raise HTTPException(status_code=404, detail="No users found")

    return users
