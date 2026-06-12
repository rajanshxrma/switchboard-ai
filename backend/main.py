from fastapi import FastAPI, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from services.twilio_ws import TwilioVoiceConnection

app = FastAPI(title="Enterprise Voice AI", version="1.0.0")

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

@app.websocket("/ws/twilio")
async def websocket_endpoint(websocket: WebSocket):
    connection = TwilioVoiceConnection(websocket)
    await connection.handle()

if __name__ == "__main__":
    import uvicorn
    from config import settings
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
