# Shadowfall Idle owner-only idea inbox (STAGED)

A separate, passwordless Cloudflare Access-protected Worker provides the private review dashboard. **Do not paste this code into the existing public `shadowfall-ideas-api` Worker.** The existing Worker must remain public for anonymous visitor submissions.

## Dashboard features
- Pending, Acknowledged, Added, Rejected and All filters with counters.
- Displays submitted call name, title, category, description and time from D1.
- Permitted transitions: Pending → Acknowledged or Rejected; Acknowledged → Added or Rejected; Rejected → Acknowledged; Added → Acknowledged (removes public approval).
- Reviewer notes and moderation audit records in `moderation_events`. Records only the verified admin email from Access.
- Approved ideas become visible to the public `GET /public/ideas` endpoint via existing Worker. The public website must still be connected to that endpoint before the mindmap reflects approvals.
- Buttons and API requests are secured by Worker-level Cloudflare Access plus the server-side `ADMIN_EMAIL` allowlist. A missing Access identity rejects all requests.

## Owner setup
1. Create a **second** Cloudflare Worker, named `shadowfall-ideas-admin`. Do not edit, replace, or apply Access to `shadowfall-ideas-api`.
2. In the new admin Worker's **Access** tab, select **Protect this Worker behind Access** → **All traffic**. Configure an **Allow** policy for exactly the owner's login email, using an email one-time PIN or appropriate identity provider. Do not configure `Everyone`, `Bypass` or whole-domain allowances. Enable Cloudflare Zero Trust first if Cloudflare asks.
3. After Access is active, copy the code from `cloudflare/admin-api.js` to the **admin** Worker using Edit code → Deploy. The code fails closed when Access is absent.
4. Add **D1 database** binding named exactly `DB` to existing `shadowfall-community-ideas` database.
5. Add encrypted **Secret** named `ADMIN_EMAIL` with exactly the same email allowed in the Access policy, then deploy.
6. Navigate to the admin Worker's production URL; sign in. Expect private stats, Pending inbox, and the test suggestion. On any 403 verify Access and `ADMIN_EMAIL` settings. **Never paste your email, login tokens or Access configuration secrets into GitHub.**
7. Test: Acknowledge the pending test idea, verify the status in D1 and `moderation_events`. Separately approve it and open the public D1 endpoint `https://shadowfall-ideas-api.htcbestofall.workers.dev/public/ideas` to verify it appears only after approval. Test Rejected and reversal on a test idea. Use a private/incognito window to verify anonymous visitors are blocked from the admin URL.
8. Once tested, wire the public mindmap to the existing D1 Worker by separately reviewing the staged `guest-config.js` configuration. Do not merge until the normal visitor submission and owner moderation flow is verified.

Security: Access *must* be attached to the Worker itself, including production and previews. Additional server-side checks use `ctx.access.getIdentity()`. Enforce same-origin requests for state-changing calls. This dashboard intentionally does not edit the separate private `dashcoon/idle-arpg-gsme-` repository. This first version limits each view to the 200 newest suggestions; pagination is a later feature.

Current status: **CODE PREPARED ONLY. Not deployed. Not security or end-to-end tested.** The public test submission and live mindmap remain unchanged.
