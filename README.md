# Mullem Platform

Saudi educational web app MVP with an AI tutor for the Saudi curriculum.

## Stack

- `Next.js` App Router
- `Tailwind CSS v4`
- `TypeScript`
- `OpenAI Responses API`
- local curriculum retrieval layer with room to upgrade to `PostgreSQL + pgvector`

## Implemented MVP

- Arabic landing page and role-based dashboards
- Student academic chat
- Student answer analysis
- Local session-based auth demo for `student`, `teacher`, `parent`, `admin`
- Curriculum endpoints: `subjects`, `grades`, `lessons`, `lesson/:id`
- Question solving and similar-question APIs
- Image question upload endpoint with model-based extraction when `OPENAI_API_KEY` is set
- Basic moderation, rate limiting, and logging utilities

## Environment

Copy `.env.example` to `.env.local` and set:

```bash
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-5.4-mini
APP_URL=http://localhost:3000
JWT_SECRET=change-me-in-production
SERPAPI_API_KEY=server-only-key
SERPAPI_BASE_URL=https://serpapi.com/search.json
SERPAPI_TIMEOUT_SECONDS=8
SERPAPI_MAX_RESULTS=5
TRUSTED_SEARCH_DOMAINS=ien.edu.sa,beitalelm.com,mawdoo3.com
ANALYSIS_BUDGET_MS=5000
```

## Run

```bash
npm install
npm run dev
```

## Notes

- Without `OPENAI_API_KEY`, the platform uses a local fallback response mode so the UI and API still work.
- The current auth layer is a prototype cookie session for fast MVP delivery; production should move to signed JWT/OTP or a full auth provider.
- The retrieval layer is currently in-memory sample curriculum content and is designed to be replaced by real curriculum ingestion and vector search.
- `SERPAPI_API_KEY` must live on the server only. Do not expose it in frontend JavaScript or HTML.

## FastAPI Search Backend Scaffold

The repo now includes a backend scaffold in [C:\mullem\backend](C:\mullem\backend) for a secure search flow:

- `approved question bank` first
- `curriculum retrieval` second
- `SerpApi web verification` third

Main endpoint:

```bash
POST /api/solve-question
```

Run locally after installing backend dependencies:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The scaffold includes:

- [C:\mullem\backend\main.py](C:\mullem\backend\main.py)
- [C:\mullem\backend\app\config.py](C:\mullem\backend\app\config.py)
- [C:\mullem\backend\app\engines.py](C:\mullem\backend\app\engines.py)
- [C:\mullem\backend\app\question_bank.py](C:\mullem\backend\app\question_bank.py)
- [C:\mullem\backend\app\curriculum.py](C:\mullem\backend\app\curriculum.py)
- [C:\mullem\backend\app\serpapi_service.py](C:\mullem\backend\app\serpapi_service.py)
- [C:\mullem\backend\app\admin_config.py](C:\mullem\backend\app\admin_config.py)
- [C:\mullem\backend\app\log_store.py](C:\mullem\backend\app\log_store.py)

Current scope:

- secure environment-based SerpApi integration
- trusted-domain web verification
- hidden analysis output with normalized/canonical question forms
- sample approved question bank and curriculum evidence
- admin-configurable trusted domains via:
  - `GET /api/admin/search-config`
  - `PUT /api/admin/search-config`
- internal search logs via:
  - `GET /api/admin/search-logs`

Next production step:

- replace the sample bank with PostgreSQL/pgvector or Qdrant-backed storage
- connect admin-selected trusted domains from the dashboard to the backend settings
- add persistent logs and caching via Redis/Celery

Security note:

- Never place `SERPAPI_API_KEY` in frontend JavaScript or HTML.
- If a key was pasted in chat or shared in plaintext, rotate it from the SerpApi dashboard and set the new value on the server only.
