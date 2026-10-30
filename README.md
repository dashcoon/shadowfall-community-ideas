# Shadowfall Idle — Public Community Idea Board

A static, free-to-host community idea mind map, separate from the PRIVATE canonical Shadowfall Idle GitHub repository. Built using HTML, CSS, JavaScript, GitHub Pages, and GitHub Issues. **Do not upload private repository documents or game source to this public repository.**

## Deploy to GitHub Pages

1. On GitHub, create a **new PUBLIC repository**, for example `shadowfall-community-ideas`. This is a separate repository from `idle-arpg-gsme-`. Keep the old repository private.
2. Upload **all the contents** of this folder (including `index.html`, `styles.css`, `app.js`, `seed.js`, `official-ideas.json`, `.github/ISSUE_TEMPLATE/idea.yml`, `.github/ISSUE_TEMPLATE/config.yml`, `.nojekyll`) to the **root of the new repository**. Preserve folder names.
3. In the new repository, open **Settings → Pages**. Under **Build and deployment → Source**, select **Deploy from a branch**; select **main** and **/(root)**, then Save.
4. Under **Settings → General → Features**, make sure **Issues** is enabled and open to the public. GitHub users must sign in to submit suggestions.
5. Add GitHub issue labels: `acknowledged`, `added-to-board`, `rejected`. You need write/triage permission to apply them; visitors cannot approve ideas.
6. Open the URL shown in Settings → Pages after publication. The app automatically detects the `owner/repository` address from GitHub Pages, so you generally do not need to configure anything.
7. Test a new GitHub issue using **Issues → New issue → Suggest a game idea**. The website refreshes public issue data every two minutes and also has a Refresh button.

## Review workflow

- **Pending**: public issue submitted with authenticated GitHub author; visible to everyone as `@username thinks this would be a good idea`.
- **Acknowledged**: repository owner adds issue label `acknowledged` (the separate Acknowledged tab shows it). This is NOT approval.
- **Added to board**: owner adds `added-to-board` label. It then appears in the curated idea list and mind map as a community idea. This does **NOT** modify the separate private GitHub canonical board; export/paste it there only if you want.
- **Rejected**: owner adds `rejected` label; stays listed with that status (can later be reopened/reviewed).

You can find issue label controls in the issue's right-hand sidebar. GitHub determines whether the user can change labels. Only people with sufficient repository permissions can promote/acknowledge issues. Suggestion content remains public, and GitHub account sign-in is required to post.

## Costs, limits, security

- No Replit or Lovable required. GitHub Pages supports hosting from public repos on GitHub Free, within GitHub's usage limits.
- Pages is static; dynamic suggestions are GitHub Issues, read using the public GitHub API. Anonymous API requests are rate-limited, so the site displays a helpful error if GitHub temporarily refuses requests.
- Keep the **private game repository private**. This public board contains only the curated feature descriptions in `official-ideas.json`, not sensitive sources.
- The visitor-facing board never holds any GitHub tokens; reviewer permissions are enforced through GitHub itself.
- The community-updated board and the private canonical board are deliberately distinct. "Added" requires GitHub label review; private synchronization is manual.

## Offline preview

Open `index.html` directly in a browser to inspect the original mind map. Public user submissions will only work after publishing this site under a separate public GitHub repository. The local preview is not a live multi-user editor.
## Staged guest submissions (feature branch; NOT live yet)

The original owner-approved public version uses GitHub Issues and is **unchanged on main**. A work-in-progress branch `feature/nickname-guest-submissions` adds a direct on-site modal with an optional user-chosen **call name** (nickname), title, category and description. No GitHub account or email is required for visitors. Nicknames are **not verified identities** and may repeat; the public board must label them appropriately.

Because GitHub Pages is a static host, anonymous writes **cannot** be safely sent directly to GitHub without exposing the owner’s API token. The branch therefore contains `worker/guest-submissions.js`, a Cloudflare Worker for server-side validation and spam prevention, plus a Cloudflare Turnstile bot check. Submitted ideas are stored as *public GitHub Issues* under a bot/owner token with the nickname in the issue body; owner acknowledgement/approval still uses `acknowledged` and `added-to-board` issue labels. GitHub tokens and Turnstile secret keys must never be placed in the Pages client files.

### Required manual configuration before merge

1. Create a Cloudflare account if needed and register a free Turnstile widget for hostname **dashcoon.github.io**; get its PUBLIC site key and PRIVATE secret.
2. Create a Cloudflare Worker and deploy `worker/guest-submissions.js`. The Worker requires a **fine-grained GitHub token** with *Issues read/write for only* `dashcoon/shadowfall-community-ideas` as an encrypted secret `GITHUB_TOKEN`, and the private Turnstile key as encrypted secret `TURNSTILE_SECRET`. Do **not** grant any permission to the private Shadowfall game repo. Review provider pricing/quotas and do not create paid services without approval.
3. Set only the Worker public HTTPS endpoint plus PUBLIC Turnstile site key in `guest-config.js`.
4. Test from a browser: open form, choose call name, submit idea, check that a public GitHub issue appears under Pending, assign `acknowledged`, refresh the website and see Acknowledged, then separately assign `added-to-board` and see it appear on the mind map.
5. After those steps pass, merge this feature branch to `main`. Without configured backend/Turnstile, the guest form is intentionally not enabled and the fallback GitHub issue link remains available.

**Security/limitations:** public nicknames are self-chosen, not account names; no identity guarantees. All public submissions visible to everyone. Turnstile provides bot protection but not a perfect abuse defense; use Cloudflare rate limits and monitor GitHub API limits, add moderation/limits before advertising widely. Owner approves by GitHub labels; public visitors cannot add labels via the website. A successful submission does not approve an idea or change the separate private canonical game board. The owner must explicitly approve copying it into that board.

**No Lovable/Replit credits spent. No public main-branch changes have been made yet for nickname submissions.**
