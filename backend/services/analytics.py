import asyncio
import json
import openai
from config import settings
from database import SessionLocal, CallRecord, Transcript, CallOutcome

client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def analyze_failed_calls():
    """
    Background job that finds calls marked as 'rejected_other' or 'failed',
    reads their transcripts, and uses the LLM to extract the exact reason.
    """
    db = SessionLocal()
    try:
        # find calls that haven't been analyzed yet
        failed_calls = db.query(CallRecord).filter(
            CallRecord.outcome.in_([CallOutcome.REJECTED_OTHER, CallOutcome.REJECTED_PRICE])
        ).all()
        
        for call in failed_calls:
            transcripts = db.query(Transcript).filter(Transcript.call_id == call.id).order_by(Transcript.timestamp).all()
            if not transcripts:
                continue
                
            convo = "\n".join([f"{t.speaker}: {t.text}" for t in transcripts])
            
            prompt = f"""
            Analyze this failed sales/support call transcript.
            Why did the call fail? Extract the primary reason.
            
            Transcript:
            {convo}
            
            Output strictly as JSON:
            {{"primary_reason": "string (e.g. 'price too high', 'AI sounded robotic', 'competitor mentioned')"}}
            """
            
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            reason_data = json.loads(response.choices[0].message.content)
            print(f"Call {call.twilio_call_sid} failed because: {reason_data.get('primary_reason')}")
            
            # in a full production system, we would save this to an 'analytics_insights' table
            
    finally:
        db.close()

def get_dashboard_stats():
    """Returns aggregated stats for the React dashboard"""
    db = SessionLocal()
    try:
        total_calls = db.query(CallRecord).count()
        sales_closed = db.query(CallRecord).filter(CallRecord.outcome == CallOutcome.SALE_CLOSED).count()
        escalated = db.query(CallRecord).filter(CallRecord.outcome.in_([CallOutcome.ESCALATED_HUMAN, CallOutcome.ESCALATED_LEGAL_RISK])).count()
        
        win_rate = (sales_closed / total_calls * 100) if total_calls > 0 else 0
        
        return {
            "total_calls": total_calls,
            "win_rate_percentage": round(win_rate, 2),
            "escalations": escalated,
            "active_calls": db.query(CallRecord).filter(CallRecord.status == "in_progress").count()
        }
    finally:
        db.close()
