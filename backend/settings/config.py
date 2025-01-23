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
    ALLOWED_ORIGIN: list[str]
    REDIS_URL: str

    @property
    def ALLOWED_ORIGIN_LIST(self) -> list[str]:
        """Преобразует ALLOWED_ORIGIN из строки в список (если это строка)."""
        if isinstance(self.ALLOWED_ORIGIN, str):
            return self.ALLOWED_ORIGIN.split(",")
        return self.ALLOWED_ORIGIN

    model_config = SettingsConfigDict(env_file=".env")


# Load settings
settings = Settings()


