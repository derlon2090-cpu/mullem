# Mullem

Mullem frontend pages live in the project root, while the production-ready Node backend is served from the same root through [server.js](C:\mullem\server.js).

## Current deployment model

- If you deploy the whole repository as a Node web service, keep [mullem-config.js](C:\mullem\mullem-config.js) empty and the frontend will use the same origin automatically.
- If you deploy the frontend separately as static files, set `window.MULLEM_API_BASE` to your backend domain.

Example:

```js
window.MULLEM_API_BASE = "https://your-backend-domain.com";
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
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mullem
DB_USERNAME=root
DB_PASSWORD=
CORS_ALLOWED_ORIGINS=*
```

3. Install and run:

```bash
npm install
node server.js
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
- Build command: `npm install`
- Start command: `node server.js`
- Health check path: `/api/health`

Set these environment variables in Render:

```env
OPENAI_API_KEY=your_real_key
OPENAI_MODEL=gpt-5.4-mini
DB_HOST=your_mysql_host
DB_PORT=3306
DB_DATABASE=mullem
DB_USERNAME=your_mysql_user
DB_PASSWORD=your_mysql_password
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

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
- `mysql-data`
- `node_modules`
- `laravel-api/vendor`
- local PHP/MySQL binaries
