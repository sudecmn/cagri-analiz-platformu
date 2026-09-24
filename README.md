# CallMind — AI-Powered Call Analytics & Quality Control Platform

CallMind is an end-to-end platform that automatically transcribes call
center conversations (from audio recordings or text) and analyzes them
with AI — with KVKK-compliant (Turkish data protection law) PII masking,
role-based access control, and supervisor quality evaluation.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Roles & Authorization](#roles--authorization)
- [Security](#security)
- [Project Structure](#project-structure)
- [Known Limitations / Roadmap](#known-limitations--roadmap)

## Features



- **Automatic Speech-to-Text:** Uploaded audio recordings are
  automatically transcribed using OpenAI Whisper. Audio files from
  various sources (including non-standard muxing) are normalized
  through an ffmpeg preprocessing step before transcription.
- **AI-Powered Analysis:** Each call is automatically summarized,
  sentiment-scored, topic-classified, and keyword-extracted using
  OpenAI GPT-4o-mini. Analysis runs asynchronously via `BackgroundTasks`
  — the client receives an immediate `202 Accepted` while the result is
  tracked through `pending → completed/failed` states.
- **KVKK-Compliant PII Masking:** A regex-based module automatically
  redacts sensitive data (national ID numbers, phone numbers, IBANs)
  before a transcript is written to the database. Raw, unmasked content
  is never persisted.
- **Role-Based Access Control (RBAC):** `agent`, `supervisor`, and
  `admin` roles — agents can only view their own calls, while
  supervisors and admins can access all records.
- **Supervisor Evaluation:** Supervisors/admins can score a call's
  quality and attach notes.
- **User Management:** Admin-only user listing, creation, and
  activation/deactivation.
- **Dashboard:** Key metrics — total calls, average sentiment score,
  sentiment distribution, and top topics — visualized with interactive
  charts (donut, bar).
- **PDF / Excel Export:** Export a single call's details as PDF, or the
  full transcript list as Excel.
- **External System Integration:** A separate, API-key-protected upload
  endpoint simulating integration with a real call center/PBX system.

  ## Screenshots

### 1. Executive Dashboard
<img width="1919" height="1009" alt="Ekran görüntüsü 2026-09-24 150710" src="https://github.com/user-attachments/assets/2e55ee0c-5afc-42b7-8774-77b455fa1450" />




### 2. Call Detail & AI Analysis
<img width="1830" height="1011" alt="image" src="https://github.com/user-attachments/assets/92e2ab50-0240-49d9-a151-b1c482d33b86" />



### 3. Audio Ingestion (Speech-to-Text)
<img width="1357" height="524" alt="image" src="https://github.com/user-attachments/assets/3640e064-25b4-4a74-87f4-ecd651cc4096" />



### 4. Authentication
<img width="1410" height="1013" alt="Ekran görüntüsü 2026-07-20 131616" src="https://github.com/user-attachments/assets/0c5ceba9-5de0-45b7-9ce8-8e1d67c54a9c" />


## Tech Stack

## Tech Stack

**Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL, JWT (python-jose),
bcrypt (passlib), OpenAI API (GPT-4o-mini + Whisper), reportlab, openpyxl,
ffmpeg (imageio-ffmpeg)

**Frontend:** React (Vite), React Router, axios, recharts

**Infrastructure:** Docker (PostgreSQL container)

## System Architecture

```
User (browser)              External system (PBX, via X-API-Key)
        │                              │
        ▼                              │
   Frontend (React)                    │
        │                              │
        └──────────────┬───────────────┘
                        ▼
              Backend (FastAPI, JWT + RBAC)
                    │         │
                    ▼         ▼
             PostgreSQL   OpenAI API
                          (Whisper + GPT-4o-mini,
                           background / async)
```

AI analysis and transcription run in the background via `BackgroundTasks`
so they never block the request.

## Setup

### Requirements

- Python 3.11+
- Node.js 18+
- Docker
- An OpenAI API key

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

# Start the database with Docker
docker compose up -d

# Create a .env file (see "Environment Variables" below)

# Create the tables
python
>>> from app.core.database import Base, engine
>>> from app.models.user import User
>>> from app.models.transcript import Transcript
>>> from app.models.analysis import Analysis
>>> from app.models.evaluation import Evaluation
>>> Base.metadata.create_all(bind=engine)
>>> exit()

uvicorn app.main:app --reload
```

The backend runs at `http://localhost:8000`; API docs are available via
Swagger UI at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

## Environment Variables

Define the following in `backend/.env`:

```
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<database>
OPENAI_API_KEY=<your-openai-api-key>
CALLMIND_API_KEY=<static API key for external system integration>
```

## API Endpoints

| Method | Path | Description | Authorization |
|---|---|---|---|
| POST | `/auth/login` | Log in, returns a JWT token | — |
| POST | `/users` | Create a new user | admin |
| GET | `/users` | List users | admin |
| PATCH | `/users/{id}` | Activate/deactivate a user | admin |
| POST | `/transcripts` | Upload a text transcript | authenticated |
| POST | `/transcripts/upload-audio` | Create a transcript from an audio file | authenticated |
| POST | `/transcripts/external-upload` | Upload audio from an external system | API key |
| GET | `/transcripts` | List transcripts | agent: own records only; supervisor/admin: all |
| GET | `/transcripts/{id}/analysis` | Get analysis result | ownership check |
| POST | `/transcripts/{id}/retry-analysis` | Retry a failed analysis | ownership check |
| GET | `/transcripts/export/excel` | Download all transcripts as Excel | agent: own records only |
| GET | `/transcripts/{id}/export/pdf` | Download a single call as PDF | ownership check |
| POST | `/transcripts/{id}/evaluation` | Evaluate a call | supervisor/admin |
| GET | `/transcripts/{id}/evaluation` | Get an evaluation | ownership check |
| GET | `/dashboard/stats` | Get overall statistics | agent: own data; supervisor/admin: all |

See `/docs` (Swagger UI) for the full schema and an interactive testing
interface.

## Roles & Authorization

| Role | Permissions |
|---|---|
| `agent` | Can view calls they uploaded, upload transcripts/audio |
| `supervisor` | Can view all calls, submit evaluations |
| `admin` | All of the above, plus user management |

Authentication is handled via JWT (HS256); every protected endpoint
requires a valid token through the `get_current_user` dependency.

## Security

- Passwords are hashed with `bcrypt`; plaintext is never stored.
- Sensitive personal data (national ID, phone number, IBAN) is masked by
  a regex-based module before being written to the database — raw
  content is never persisted.
- All single-record endpoints (analysis, PDF export, evaluation) enforce
  ownership checks against IDOR (Insecure Direct Object Reference)
  vulnerabilities — an agent cannot access a record they don't own even
  if they know its ID.
- The external system integration is protected by a separate static API
  key (`X-API-Key` header) rather than JWT.

## Project Structure

```
backend/
  app/
    core/        # database, security, masking, ai_service, roles
    models/      # SQLAlchemy ORM models
    schemas/     # Pydantic schemas
    routers/     # API endpoints
    fonts/       # Unicode fonts for PDF export
frontend/
  src/
    components/  # Pages and components
    api/         # axios instance
docs/            # Requirements, architecture, and database documentation
```

## Known Limitations / Roadmap

- The search bar in the top navigation is not yet wired to a real search
  endpoint (currently decorative).
- The project currently uses `Base.metadata.create_all()`; migrating to
  Alembic for versioned schema migrations is under consideration.
- Failed analyses can currently only be retried manually; an automatic
  retry mechanism is planned.
- Speaker diarization (who spoke when) is not yet supported; transcripts
  are stored as a single text block.

---

This project was developed as part of a software development internship
at Customer Experience Ltd.
