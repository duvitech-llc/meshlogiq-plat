import { createContext, useContext, useEffect, useState } from 'react'
import keycloak from '../auth/keycloak'
import { initKeycloak } from '../auth/initKeycloak'
import { useUserProfile } from '../hooks/useUserProfile'

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

  // Use the profile hook to manage user profile state
  const profileHook = useUserProfile(token)

  useEffect(() => {
    let refreshTimer
    initKeycloak()
      .then((auth) => {
        setKcReady(true)
        if (auth) {
          console.log('🔐 Keycloak authenticated, token available')
          setToken(keycloak.token)
          
          // Set up token refresh timer
          refreshTimer = setInterval(async () => {
            try {
              const refreshed = await keycloak.updateToken(30)
              if (refreshed) {
                console.log('🔄 Token refreshed')
                setToken(keycloak.token)
              }
            } catch (e) {
              console.warn('Token refresh failed', e)
            }
          }, 10000)
        } else {
          console.log('🔓 No authentication found')
        }
      })
      .catch((e) => {
        console.error('🚫 Keycloak initialization failed:', e)
        setError(String(e))
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

  const login = () => keycloak.login({
    redirectUri: window.location.origin + '/dashboard'
  })

  const signup = () => keycloak.register({
    redirectUri: window.location.origin + '/welcome'
  })

  const logout = () => keycloak.logout({ redirectUri: window.location.origin + '/' })

  const value = {
    // Keycloak auth state
    kcReady,
    token,
    error,
    keycloak,
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
    isAuthenticated: kcReady && !!token,
    isFullyLoaded: kcReady && (!!token ? profileHook.initialized && !!profileHook.profile : true),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
