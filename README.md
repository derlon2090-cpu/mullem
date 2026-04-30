# Mullem

Mullem frontend pages live in the project root, while the production-ready Node backend is served from the same root through [server.js](C:\mullem\server.js).

## Current deployment model

- If you deploy the whole repository as a Node web service, keep [mullem-config.js](C:\mullem\mullem-config.js) empty and the frontend will use the same origin automatically.
- If you deploy the frontend separately as static files, set `window.MULLEM_API_BASE` to your backend domain.

Example:

```js
window.MULLEM_API_BASE = "https://your-backend-domain.com";
```

Current Render backend:

```js
window.MULLEM_API_BASE = "https://mullem-spdu.onrender.com";
```

You can also temporarily override the backend URL by opening the site with:

```text
?api=https://your-backend-domain.com
```

## Required backend endpoints

The frontend expects these routes to exist:

- `GET /api/health`
- `GET /api/ready`
- `POST /api/chat/send`
- `POST /api/solve-question`
- `GET /api/chat/sessions`

## Local run

1. Copy `.env.example` to `.env`
2. Fill in:

```env
PORT=3000
OPENAI_API_KEY=your_real_key
OPENAI_MODEL=gpt-5.4-mini
OPENAI_MAX_OUTPUT_TOKENS=500
DB_CLIENT=postgres
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
CORS_ALLOWED_ORIGINS=*
MAX_HISTORY_MESSAGES=5
TEXT_MESSAGE_XP_COST=10
IMAGE_GENERATION_XP_COST=15
ATTACHMENT_ANALYSIS_XP_COST=20
DAILY_LOGIN_XP_REWARD=5
```

3. Install and run:

```bash
npm install
npm run dev
```

4. Open:

```text
http://127.0.0.1:3000
```

## Deploy on Render

This repository already includes [render.yaml](C:\mullem\render.yaml).

Recommended setup:

- Create a new Render Web Service from the repository root
- Runtime: Node
- Build command: `npm run render:build`
- Start command: `npm run render:start`
- Health check path: `/api/health`

Set these environment variables in Render:

```env
OPENAI_API_KEY=your_real_key
OPENAI_MODEL=gpt-5.4-mini
DB_CLIENT=postgres
DATABASE_URL=your_neon_postgres_connection_string
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

Production storage is Neon/PostgreSQL only. Use `DATABASE_URL` from Neon.

The backend also accepts common Neon/Vercel names if your provider creates them automatically: `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_URL_UNPOOLED`, `DATABASE_URL_UNPOOLED`, `NEON_DATABASE_URL`, `NEON_POSTGRES_URL`, and `DATABASE_PRIVATE_URL`.

If Render is your backend, the Neon URL must be set in the Render Web Service environment, not only in Vercel. Paste only the URL value, not `DATABASE_URL=...`; the server now also tolerates that common paste mistake.

## XP and package rules

- New student accounts start with `50 XP`.
- Free accounts receive `5 XP` once per new login day.
- Paid packages reset the daily balance to the package daily XP amount.
- Text chat requests cost `10 XP`.
- Image attachments cost `15 XP`.
- File/document analysis costs `20 XP`.
- OpenAI responses are capped with `OPENAI_MAX_OUTPUT_TOKENS=500` by default.
- Conversation context is limited with `MAX_HISTORY_MESSAGES=5` to keep responses fast and costs controlled.

Default paid packages inserted into Neon:

- `شرارة`: `80 XP` daily, `9 SAR` monthly.
- `طويق`: `250 XP` daily, `29 SAR` monthly.
- `الرائد`: `600 XP` daily, `59 SAR` monthly.

## Neon database schema

The Node backend creates and maintains these PostgreSQL tables automatically on startup:

- `app_users`: accounts, auth profile, role, XP balance, streak, and current plan fields.
- `app_packages`: editable packages with name, daily XP, price, duration, summary, and benefits.
- `app_subscriptions`: subscription history for each user, including active package, price, XP, start, and expiry.
- `app_api_tokens`: persistent login tokens used to keep users signed in across refreshes and page changes.
- `app_projects`: student projects and folders.
- `conversations`: saved chats attached to the logged-in user and optionally to a project.
- `messages`: all user/assistant messages for saved conversation history.
- `app_guest_usage`: guest usage tracking when guest mode is enabled.

## Deploy on Railway

This repository already includes [railway.json](C:\mullem\railway.json).

Recommended setup:

- Create a new Railway service from the repository root
- Start command: `node server.js`
- Health path: `/api/health`

Set the same environment variables used for Render.

## Verify deployment

After deployment, open:

```text
https://your-backend-domain.com/api/health
```

You should receive JSON, not HTML.

If the browser shows `The page could not be found`, then you deployed only the static frontend and not the real backend service.

## Security

Do not commit these files or folders publicly:

- `.env`
- local database data folders
- `node_modules`
- `laravel-api/vendor`
- local runtime binaries
