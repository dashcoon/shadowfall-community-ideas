// Public non-secret configuration. No guest API is enabled until endpoint + Turnstile are deployed.
window.SHADOWFALL_GUEST_CONFIG={
  endpoint:"", // HTTPS Cloudflare Worker base URL, excluding trailing slash
  turnstileSiteKey:"" // public Turnstile sitekey for dashcoon.github.io
};
