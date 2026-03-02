import keycloak from './keycloak'

// Check if Keycloak is configured (environment variables are set)
const hasKeycloakConfig =
  !!import.meta.env.VITE_KEYCLOAK_URL &&
  !!import.meta.env.VITE_KEYCLOAK_REALM &&
  !!import.meta.env.VITE_KEYCLOAK_CLIENT_ID

// Hoisted to module scope — only one init per page load.
let initPromise = null

/**
 * Initialise Keycloak.
 *
 * Two modes depending on what is in the URL:
 *
 * 1. Auth-code callback  (Keycloak redirected back with ?code=…&state=…)
 *    → No `onLoad` override.  The adapter processes the code automatically.
 *      Using `check-sso` here would SKIP code processing in keycloak-js ≥ 26.
 *
 * 2. Normal page load  (no auth code in URL)
 *    → `onLoad: 'check-sso'` with a silent iframe to restore an existing
 *      Keycloak session without redirecting the user.
 *
 * Returns Promise<boolean> — true when a session was established.
 */
export function initKeycloak() {
  if (!hasKeycloakConfig) {
    return Promise.resolve(false)
  }

  if (!initPromise) {
    const params = new URLSearchParams(window.location.search)
    const isAuthCodeCallback = params.has('code') && params.has('state')

    const initOptions = {
      pkceMethod: 'S256',
      checkLoginIframe: false,
    }

    if (isAuthCodeCallback) {
      // Processing the redirect-back from Keycloak — let the adapter exchange
      // the code for tokens.  Do NOT set onLoad here, or keycloak-js 26 will
      // skip the exchange and silently return false.
      console.log('🔑 Auth-code callback detected — exchanging code for tokens')
    } else {
      // Normal page load — silently restore any existing SSO session.
      initOptions.onLoad = 'check-sso'
      initOptions.silentCheckSsoRedirectUri =
        window.location.origin + '/silent-check-sso.html'
    }

    initPromise = keycloak.init(initOptions)
  }

  return initPromise
}

/** True when all three VITE_KEYCLOAK_* env vars are present. */
export function isKeycloakConfigured() {
  return hasKeycloakConfig
}
