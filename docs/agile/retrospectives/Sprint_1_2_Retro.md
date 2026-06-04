# Sprints 1 & 2 Retrospective

## What Went Well
- FastAPI and Docker setup was seamless.
- PostgreSQL schema for `CallRecord` and `Transcript` is robust.

## What Didn't Go Well
- Deepgram STT integration was dropping binary chunks if the WebSocket latency spiked above 200ms.
- **Action Item:** We need to implement an async buffer queue to handle audio chunks during network spikes. (Ticket created: **[AB-112]**)

## Shoutouts
- Great job resolving the Twilio μ-law base64 decoding issue ahead of schedule!
