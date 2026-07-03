from fastapi import FastAPI, Depends, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from services.twilio_ws import TwilioVoiceConnection
from services.analytics import get_dashboard_stats
from services.auth import get_current_user

app = FastAPI(title="Enterprise Voice AI", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # initialize the database tables
    try:
        init_db()
        print("Database initialized successfully.")
    except Exception as e:
        print(f"Warning: Database init failed (is PostgreSQL running?): {e}")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "voice-ai-server"}

@app.get("/api/stats")
def dashboard_stats(user: dict = Depends(get_current_user)):
    """Aggregated call metrics for the dashboard. Requires a valid Supabase session token."""
    return get_dashboard_stats()

@app.get("/api/me")
def whoami(user: dict = Depends(get_current_user)):
    """Returns the authenticated user's identity. Handy for smoke-testing auth."""
    return user

@app.websocket("/ws/twilio")
async def websocket_endpoint(websocket: WebSocket):
    connection = TwilioVoiceConnection(websocket)
    await connection.handle()

if __name__ == "__main__":
    import uvicorn
    from config import settings
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
