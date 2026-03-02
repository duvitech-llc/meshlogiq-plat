// Check if Keycloak is configured (environment variables are set)
const hasKeycloakConfig = 
  import.meta.env.VITE_KEYCLOAK_URL && 
  import.meta.env.VITE_KEYCLOAK_REALM && 
  import.meta.env.VITE_KEYCLOAK_CLIENT_ID

// Only initialize Keycloak if configured
export function initKeycloak() {
  // Return a resolved promise if Keycloak is not configured
  // This allows the app to run without authentication (e.g., for landing page)
  if (!hasKeycloakConfig) {
    return Promise.resolve(false)
  }
  
  const keycloak = require('./keycloak').default
  let initPromise = null
  
  if (!initPromise) {
    initPromise = keycloak.init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      checkLoginIframe: false,
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
    })
  }
  return initPromise
}

// Export a helper to check if Keycloak is configured
export function isKeycloakConfigured() {
  return hasKeycloakConfig
}
