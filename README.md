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