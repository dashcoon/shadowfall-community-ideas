# Shadowfall Idle Guest Submissions — Cloudflare Setup (STAGING ONLY)

## What is built
The working PUBLIC GitHub Pages website on `main` is deliberately protected; guest data service is STAGED ONLY on `feature/d1-anonymous-ideas`.
- Public Cloudflare Worker `cloudflare/public-api.js` provides `POST /public/suggestions` using a nickname (no registration), server-side Turnstile verification, basic per-IP hash throttling, validation and a D1 insert with `status=pending`.
- `GET /public/ideas` returns **only** approved `added` ideas for the public mindmap, keeping pending and rejected suggestions private.
- Database schema: `cloudflare/schema.sql`.
- The guest dialog on the staging branch calls these endpoints only **after** its public endpoint and Turnstile site key are configured.
- These are **untested design/development artifacts**, not a running backend. There is no Cloudflare connection yet. GitHub Pages cannot write D1 itself.
- Creator-only admin review dashboard, verified admin authentication and status-changing API are **NOT implemented**; do not publish a dummy admin button or expose direct write endpoints.

## Required configuration and permission boundary
1. Create/open a Cloudflare account. Inspect current Workers, D1 and Turnstile quotas before enabling any paid resources.
2. Create a D1 database called `shadowfall-community-ideas`. Apply `schema.sql`.
3. Create a Turnstile widget for public hostname `dashcoon.github.io`.
4. Deploy a Worker with `cloudflare/public-api.js` and bind the D1 database as `DB`.
5. Add encrypted Worker secrets `TURNSTILE_SECRET` and `RATE_HASH_SALT` (a long random secret never saved to GitHub). The Worker requires `ALLOWED_ORIGIN=https://dashcoon.github.io` and `TURNSTILE_HOSTNAME=dashcoon.github.io`. `wrangler-public.example.jsonc` requires real D1 binding values.
6. Set only the public worker URL and Turnstile **site** key in `guest-config.js` (no secret keys). Test CORS preflight, Turnstile, request validation and actual database inserts from the GitHub Pages origin.
7. Build owner-only admin login and status-action endpoints **separately** with Cloudflare Access and server-side JWT verification. Restrict authentication to the designated owner. Never rely on front-end-only 'admin' toggles or a header supplied by visitors.
8. Test end-to-end with an anonymous nickname suggestion: pending row in D1 → authenticated owner acknowledgement → separate owner approve → idea visible on public map. Verify rejection and no private content exposure.
9. **ONLY AFTER** the full flow is verified, merge this feature branch to `main` and release the public site. Preserve current look and its 13 seed ideas.

## Avoid changing the private game
This public service has no GitHub token and cannot modify `dashcoon/idle-arpg-gsme-`. Official game-board promotion remains an explicit separate owner action. No Lovable or Replit credits needed.

## Security caveats
Turnstile reduces spam but doesn't eliminate it. Basic per-IP daily hashed quota and hourly threshold are approximations; use Cloudflare-managed rate rules or server-side durable counters for stronger enforcement. Hosting costs/quotas are separate from Lovable. Nicknames are unverified display names and public approved submissions may be impersonated.
