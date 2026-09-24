from fastapi import FastAPI

from app.core.logging_config import setup_logging
from app.routers import auth, transcripts, users, dashboard, evaluations

from fastapi.middleware.cors import CORSMiddleware

setup_logging()

app = FastAPI(title="CallMind API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(users.router)
app.include_router(auth.router)
app.include_router(transcripts.router)
app.include_router(dashboard.router)
app.include_router(evaluations.router)
@app.get("/")
def read_root():
    return {"message": "CallMind API is running"}
