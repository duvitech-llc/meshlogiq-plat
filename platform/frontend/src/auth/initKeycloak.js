import keycloak from './keycloak'

let initPromise = null

export function initKeycloak() {
  if (!initPromise) {
    initPromise = keycloak.init({
      onLoad: 'check-sso',       // or 'login-required' if you want to force login
      pkceMethod: 'S256',
      checkLoginIframe: false,   // simpler behind reverse proxies
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
    })
  }
  return initPromise
}
