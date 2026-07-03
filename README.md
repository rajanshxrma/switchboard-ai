# Enterprise Voice AI Platform

[![Azure](https://img.shields.io/badge/azure-%230072C6.svg?style=for-the-badge&logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/) [![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/) [![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://react.dev/) [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/) [![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)](https://kubernetes.io/) [![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

A voice agent platform for phone-based sales and claims workflows. Callers dial a Twilio number, a GPT-4o router classifies their intent mid-conversation, and hands the call to a specialized sales or claims agent. Every exchange is transcribed, persisted, and aggregated into call analytics.

**Live demo:**
- Dashboard: https://ca-enterprise-frontend.icymeadow-6921df90.eastus.azurecontainerapps.io
- API (Swagger): https://ca-enterprise-backend.icymeadow-6921df90.eastus.azurecontainerapps.io/docs

---

## Architecture

```
 caller ──► Twilio Media Streams ──► FastAPI /ws/twilio (WebSocket)
                                          │
                                          ▼
                                    AgentRouter (GPT-4o)
                                    router → sales | claims
                                          │
                          ┌───────────────┼──────────────────┐
                          ▼               ▼                  ▼
                     PostgreSQL      trigger engine     analytics jobs
                  (calls, transcripts)  (close call,    (failed-call reason
                                        escalate)        extraction, stats)
                                          │
                                          ▼
                              React dashboard (Supabase auth)
```

| Component | Technology | Role |
|-----------|-----------|------|
| Voice ingress | Twilio Media Streams over WebSocket | Streams live call audio to the backend |
| Agent engine | OpenAI GPT-4o with JSON-contract prompts | Intent routing, sales and claims conversations, outcome triggers |
| API | FastAPI (Python 3.12) | WebSocket handling, authenticated REST endpoints |
| Persistence | PostgreSQL + SQLAlchemy | Call records, transcripts, outcomes |
| Auth | Supabase (JWT, HS256) | Email/password sessions; backend verifies tokens locally with no network hop |
| Dashboard | React 19 + Vite | Live call simulator and analytics UI |
| Infrastructure | Terraform, AKS / Azure Container Apps | Reproducible cloud environments |
| CI/CD | Azure Pipelines | Tests gate every PR; main deploys to ACR + AKS |

### Agent design

The conversation engine is a state machine with three modes. Every LLM response is forced into a JSON contract (`response_format: json_object`) carrying the spoken message plus machine-readable `route` and `trigger` fields:

- `router` — first contact; classifies the caller and swaps in the specialist system prompt
- `sales` — product Q&A and closing; a `payment` trigger marks the call `sale_closed`
- `claims` — warranty handling; fire/injury/legal language forces an `escalate_legal_risk` trigger and immediate human handoff

Failed calls get a second pass: an async analytics job re-reads the transcript and extracts the concrete reason the call was lost.

---

## Quickstart

### Option A — Docker (recommended)

```bash
git clone https://github.com/rajanshxrma/enterprise-voice-ai.git
cd enterprise-voice-ai
docker compose up --build
```

- Dashboard: http://localhost:8080
- API docs: http://localhost:8000/docs

Postgres is included; no local database setup needed.

### Option B — run services directly

```bash
# backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in keys
uvicorn main:app --reload

# frontend (separate terminal)
cd frontend
npm install
cp .env.example .env.local  # fill in Supabase keys
npm run dev
```

### Configuration

| Variable | Where | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | backend | PostgreSQL connection string |
| `OPENAI_API_KEY` | backend | GPT-4o agent engine |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | backend | Live call ingress |
| `DEEPGRAM_API_KEY` / `CARTESIA_API_KEY` | backend | Speech-to-text / text-to-speech |
| `SUPABASE_JWT_SECRET` | backend | Verifies session tokens on protected endpoints |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | frontend | Supabase client for login |

Without Supabase keys the dashboard runs in open demo mode (no login); without Twilio/OpenAI keys the simulator still works fully in the browser via the Web Speech API.

---

## Authentication

Supabase issues a JWT on sign-in; the React app attaches it as a bearer token and FastAPI verifies the HS256 signature locally — no auth-service round trip per request.

```
POST supabase /auth  ──► session JWT ──► Authorization: Bearer <token>
                                              │
                              FastAPI dependency verifies signature + expiry
                                              │
                              401 unauthenticated ── 200 authenticated
```

Protected endpoints: `GET /api/stats` (dashboard aggregates), `GET /api/me` (identity smoke test). `GET /health` stays public for container probes.

---

## Testing & CI

```bash
cd backend && pytest tests/ -v
cd frontend && npm run lint && npm run build
```

Azure Pipelines runs both suites on every PR targeting `main` (`pr` trigger in `.azure-pipelines/ci-cd.yml`). With a branch-validation policy on `main`, a red build blocks the merge — deploys only happen on green pushes to `main`, never on PR validation runs.

Deployment: images build into Azure Container Registry, then roll out to AKS via the checked-in manifest, or to Azure Container Apps through `deploy_aca.sh`. Terraform for the AKS cluster lives in `infrastructure/terraform/`. The capacity trade-offs behind the ACA migration are documented in [ENGINEERING_LOG.md](ENGINEERING_LOG.md).

---

## Project structure

```
backend/
  main.py                 # FastAPI app: websocket + REST endpoints
  config.py               # env-driven settings
  database.py             # SQLAlchemy models: CallRecord, Transcript
  services/
    twilio_ws.py          # Twilio Media Streams connection handler
    llm_router.py         # agent state machine + trigger engine
    prompts.py            # system prompts (JSON output contracts)
    analytics.py          # dashboard stats + failed-call analysis
    auth.py               # Supabase JWT verification dependency
  tests/                  # pytest suite (runs on every PR)
frontend/
  src/App.jsx             # dashboard + voice simulator
  src/Login.jsx           # Supabase email/password auth
  src/lib/supabase.js     # client bootstrap
infrastructure/
  terraform/              # AKS cluster definition
  k8s/                    # deployment manifest
.azure-pipelines/ci-cd.yml
docs/agile/               # sprint planning, retros, board imports
```

---

## Roadmap

- Wire Deepgram STT and Cartesia TTS into the Twilio audio path (currently the browser simulator uses the Web Speech API)
- Persist failed-call analysis to an `analytics_insights` table and chart it on the dashboard
- Role-based access (admin vs. analyst) on top of Supabase claims
- Load testing the WebSocket path before advertising concurrency numbers

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). PRs must pass the pipeline before merge.
