import json
import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from services.llm_router import AgentRouter
from database import SessionLocal, CallRecord, CallStatus

class TwilioVoiceConnection:
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.stream_sid = None
        self.call_sid = None
        self.router = None
        
    async def handle(self):
        await self.websocket.accept()
        print("Twilio WebSocket connection accepted.")
        
        try:
            while True:
                message = await self.websocket.receive_text()
                data = json.loads(message)
                
                if data['event'] == 'start':
                    self.stream_sid = data['start']['streamSid']
                    self.call_sid = data['start']['callSid']
                    print(f"Call started: {self.call_sid}")
                    
                    # initialize call record in db
                    self._init_call_record()
                    
                    # initialize the AI Router
                    self.router = AgentRouter(self.call_sid)
                    
                    # trigger initial greeting
                    greeting_response = await self.router.process_user_message("hello")
                    await self._send_audio_response(greeting_response["text"])
                    
                elif data['event'] == 'media':
                    # in a real production system, this payload['media']['payload'] (base64 mu-law audio) 
                    # would be piped continuously into Deepgram WebSocket for real-time STT.
                    # for this architecture demonstration, we assume STT yields complete text utterances.
                    
                    # pseudo-code for STT yielding text:
                    # user_text = await deepgram_stt.process(audio_bytes)
                    # if user_text:
                    #     ai_response = await self.router.process_user_message(user_text)
                    #     await self._send_audio_response(ai_response["text"])
                    #     if ai_response["is_call_over"]:
                    #         await self.websocket.close()
                    pass
                    
                elif data['event'] == 'stop':
                    print(f"Call ended by user: {self.call_sid}")
                    break
                    
        except WebSocketDisconnect:
            print(f"Twilio disconnected: {self.call_sid}")
        finally:
            self._mark_call_completed()
            
    async def _send_audio_response(self, text: str):
        # 1. send text to Cartesia TTS
        # 2. receive raw audio bytes
        # 3. encode as base64 mu-law
        # 4. send back to Twilio via WebSocket
        
        # mock sending media payload back to twilio
        media_message = {
            "event": "media",
            "streamSid": self.stream_sid,
            "media": {
                "payload": "mock_base64_audio_payload"
            }
        }
        await self.websocket.send_json(media_message)
        print(f"Agent sent response: '{text}'")

    def _init_call_record(self):
        db = SessionLocal()
        try:
            record = CallRecord(
                twilio_call_sid=self.call_sid,
                caller_number="unknown",
                status=CallStatus.IN_PROGRESS
            )
            db.add(record)
            db.commit()
        finally:
            db.close()
            
    def _mark_call_completed(self):
        if not self.call_sid:
            return
        db = SessionLocal()
        try:
            record = db.query(CallRecord).filter(CallRecord.twilio_call_sid == self.call_sid).first()
            if record and record.status == CallStatus.IN_PROGRESS:
                record.status = CallStatus.NO_ANSWER
                db.commit()
        finally:
            db.close()
