# Release Discipline

Mullem uses three release channels:

| Channel | Branch | Render config | Auto deploy | Purpose |
| --- | --- | --- | --- | --- |
| development | `codex/*` or local branches | local `.env` | no | Build and validate changes before staging. |
| staging | `staging` | `render-staging.yaml` | yes | Production-like verification with separate database, Redis, API keys, and Sentry environment. |
| production | `main` | `render.yaml` | no | Manual promotion after staging passes. |

## Required Gate

Before promoting staging to production, run:

```bash
npm run ai:release-gate
```

This runs smoke, RAG quality, real-scale health, load, and production activation checks.

The GitHub workflow `.github/workflows/release-smoke.yml` runs the same gate for pushes to `staging` and manual production checks. Configure these repository secrets:

- `STAGING_BASE_URL`
- `PRODUCTION_BASE_URL`
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`

## Promotion Flow

1. Merge feature branch into `staging`.
2. Let Render deploy staging services.
3. Run the release gate against staging:
   ```bash
   MULLEM_TEST_BASE_URL=https://your-staging-url npm run ai:release-gate
   ```
4. If all checks pass, merge `staging` into `main`.
5. Manually deploy production in Render.
6. Run the release gate against production:
   ```bash
   MULLEM_TEST_BASE_URL=https://your-production-url npm run ai:production-activation-check
   ```

## Hotfix Flow

1. Create `hotfix/<short-name>` from `main`.
2. Apply the smallest safe fix.
3. Run:
   ```bash
   node render-build-check.js
   npm run ai:real-scale-check
   ```
4. Merge to `staging` if time allows, otherwise merge to `main` and deploy manually.
5. Open an incident if production impact occurred.

## Rollback

Rollback is a release operation, not a code deletion:

1. Identify the last green production commit or Render deploy.
2. Revert the bad commit or redeploy the previous green Render deploy.
3. Run `npm run ai:production-activation-check`.
4. Record the event in `/api/admin/incidents`.
