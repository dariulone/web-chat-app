# main.py
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from settings.config import settings
from routers import auth
from routers import user
from hooks import chatsocket
import asyncio
from settings.logging_config import logger
from database import create_all_tables, test_connection

app = FastAPI(debug=True)
asyncio.set_event_loop_policy(asyncio.DefaultEventLoopPolicy())
origin = settings.ALLOWED_ORIGIN

app.add_middleware(
    CORSMiddleware,
    allow_origins=origin,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(auth.router, prefix="/auth")
app.include_router(chatsocket.router)


@app.on_event("startup")
async def startup_event():
    await test_connection()
    await create_all_tables()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
