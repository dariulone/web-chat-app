from sqlalchemy import MetaData
from models import Base
from settings.config import settings
from settings.logging_config import logger
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import ssl

# Асинхронный URL базы данных PostgreSQL
DATABASE_URL = settings.DB_URL  # Например: postgresql+asyncpg://user:password@localhost/dbname
# Создание SSL-контекста для игнорирования проверки сертификата
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False  # Не проверять имя хоста
ssl_context.verify_mode = ssl.CERT_NONE  # Отключить проверку сертификатов
# Создание асинхронного подключения
engine = create_async_engine(
    DATABASE_URL,
    connect_args={
            "ssl": ssl_context  # Указывает, что нужно использовать SSL
        },
    pool_size=20,  # Размер пула соединений
    max_overflow=30,  # Максимальное количество переполнений
    pool_timeout=30,  # Тайм-аут для получения соединения из пула
    pool_recycle=1800,  # Время жизни соединения в пуле
)

# Сессия SQLAlchemy для асинхронных операций
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Метаданные базы данных
metadata = Base.metadata


# Получаем асинхронную сессию
async def get_db():
    session = AsyncSessionLocal()
    try:
        yield session
    finally:
        await session.close()  # Закрытие сессии вручную


# Создание всех таблиц
async def create_all_tables():
    async with engine.begin() as conn:
        logger.info("Creating all tables in the database...")
        await conn.run_sync(metadata.create_all(bind=engine))
        logger.info("All tables created successfully.")
