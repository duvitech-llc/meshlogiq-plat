import { createContext, useContext, useEffect, useState } from 'react'
import { initKeycloak, isKeycloakConfigured } from '../auth/initKeycloak'
import { useUserProfile } from '../hooks/useUserProfile'

// Create a default keycloak mock object for when it's not configured
const createMockKeycloak = () => ({
  login: () => {},
  logout: () => {},
  register: () => {},
  token: null,
  tokenParsed: null,
  authenticated: false,
  loadUserProfile: async () => {},
})

const AuthContext = createContext(null)

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [kcReady, setKcReady] = useState(false)
  const [token, setToken] = useState(null)
  const [error, setError] = useState(null)
  const [keycloak, setKeycloak] = useState(null)

  // Use the profile hook to manage user profile state
  const profileHook = useUserProfile(token)

  useEffect(() => {
    let refreshTimer
    initKeycloak()
      .then((auth) => {
        const kc = isKeycloakConfigured() ? require('../auth/keycloak').default : createMockKeycloak()
        setKeycloak(kc)
        setKcReady(true)
        if (auth && kc.authenticated) {
          console.log('🔐 Keycloak authenticated, token available')
          setToken(kc.token)
          
          // Set up token refresh timer
          refreshTimer = setInterval(async () => {
            try {
              const refreshed = await kc.updateToken(30)
              if (refreshed) {
                console.log('🔄 Token refreshed')
                setToken(kc.token)
              }
            } catch (e) {
              console.warn('Token refresh failed', e)
            }
          }, 10000)
        } else {
          console.log('🔓 No authentication found')
          setKeycloak(createMockKeycloak())
        }
      })
      .catch((e) => {
        console.warn('Keycloak not configured, running in demo mode:', e)
        setError(null) // Don't show error for missing Keycloak
        setKeycloak(createMockKeycloak())
        setKcReady(true)
      })
    return () => refreshTimer && clearInterval(refreshTimer)
  }, [])

  // Automatically fetch profile when token becomes available
  useEffect(() => {
    if (token && kcReady && !profileHook.profile && !profileHook.loading) {
      console.log('🔄 Auto-fetching user profile on login...')
      profileHook.refreshProfile()
    }
  }, [token, kcReady, profileHook.profile, profileHook.loading, profileHook.refreshProfile])

  const login = () => {
    if (keycloak) {
      keycloak.login({
        redirectUri: window.location.origin + '/dashboard'
      })
    }
  }

  const signup = () => {
    if (keycloak) {
      keycloak.register({
        redirectUri: window.location.origin + '/welcome'
      })
    }
  }

  const logout = () => {
    if (keycloak) {
      keycloak.logout({ redirectUri: window.location.origin + '/' })
    }
  }

  const value = {
    // Keycloak auth state
    kcReady,
    token,
    error,
    keycloak: keycloak || createMockKeycloak(),
    login,
    signup,
    logout,
    
    // User data from Keycloak token (basic info)
    keycloakUser: keycloak?.tokenParsed,
    
    // Enhanced user profile from backend
    profile: profileHook.profile,
    user: profileHook.user,
    organizations: profileHook.organizations,
    globalRole: profileHook.globalRole,
    
    // Profile state
    profileLoading: profileHook.loading,
    profileError: profileHook.error,
    profileInitialized: profileHook.initialized,
    hasProfile: profileHook.hasProfile,
    
    // Profile actions
    refreshProfile: profileHook.refreshProfile,
    debugToken: profileHook.debugToken,
    getPermissions: profileHook.getPermissions,
    
    // Computed state
    isAuthenticated: !!token,
    isFullyLoaded: !!token ? profileHook.initialized && !!profileHook.profile : true,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}