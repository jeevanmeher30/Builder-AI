from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes.generate import router as generate_router

app = FastAPI(title="UI Builder")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate_router)

# Serve frontend — must be last
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
