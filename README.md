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
