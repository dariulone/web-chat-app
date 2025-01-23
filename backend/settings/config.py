from typing import ClassVar
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import (
    AliasChoices,
    AmqpDsn,
    BaseModel,
    Field,
    ImportString,
    PostgresDsn,
    RedisDsn,
)
import os


class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    DB_URL: str
    ALLOWED_ORIGIN: str
    REDIS_URL: str

    model_config = SettingsConfigDict(env_file=".env")


# Load settings
settings = Settings()


