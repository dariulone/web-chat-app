from sqlalchemy import MetaData
from models import Base
from settings.config import settings
from settings.logging_config import logger
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import ssl

# Асинхронный URL базы данных PostgreSQL
DATABASE_URL = settings.DB_URL  # Например: postgresql+asyncpg://user:password@localhost/dbname
# Создание SSL-контекста для игнорирования проверки сертификата

# Создание асинхронного подключения
engine = create_async_engine(
    DATABASE_URL,
    pool_size=10,  # Количество соединений в пуле
    max_overflow=20,  # Дополнительные соединения
    future=True
)


# Сессия SQLAlchemy для асинхронных операций
async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Метаданные базы данных
metadata = Base.metadata


# Получаем асинхронную сессию
async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session


async def test_connection():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT 1"))  # Используем text() для создания SQL выражения
        logger.info(f"Connection test result: {result.scalar()}")


# Создание всех таблиц
async def create_all_tables():
    async with engine.begin() as conn:
        logger.info("Creating all tables in the database...")
        await conn.run_sync(metadata.create_all)
        logger.info("All tables created successfully.")
