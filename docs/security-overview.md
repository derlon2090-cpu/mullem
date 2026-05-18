# Security Overview

## Controls in place
- RBAC for owner, admin, support, analyst, and user.
- Security headers on responses.
- CSRF origin checks for cookie-authenticated writes.
- Rate limiting and abuse tracking.
- Secret redaction in logs and admin outputs.
- Admin action logging with request metadata.

## Operational notes
- Keep `SESSION_SECRET` configured in Render.
- Keep API keys in Render secrets only.
- Keep fine-tuning disabled until a reviewed, sanitized dataset exists.

