/**
 * Hook for managing user profile state
 */
import { useState, useEffect, useCallback } from 'react'
import { userService } from '../services/userService'

export const useUserProfile = (token) => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false) 
  const [error, setError] = useState(null)
  const [initialized, setInitialized] = useState(false)

  /**
   * Fetch user profile from backend
   */
  const fetchProfile = useCallback(async (forceRefresh = false) => {
    if (!token) {
      setProfile(null)
      setError(null)
      setInitialized(false) // Don't mark as initialized without token
      return
    }

    // Don't fetch if already have profile and not forcing refresh
    if (profile && !forceRefresh) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await userService.getProfile(token)
      
      if (result.success) {
        setProfile(result.data)
        setError(null)
        console.log('✅ User profile loaded:', result.data.profile)
      } else {
        setError(result.error)
        setProfile(null)
        console.error('❌ Profile fetch failed:', result.error)
      }
    } catch (err) {
      setError(err.message)
      setProfile(null)
      console.error('❌ Profile fetch error:', err)
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, [token, profile])

  /**
   * Debug token contents (for troubleshooting)
   */
  const debugToken = useCallback(async () => {
    if (!token) return null

    try {
      const result = await userService.debugToken(token)
      if (result.success) {
        console.log('🔍 Token debug info:', result.data)
        return result.data
      }
    } catch (err) {
      console.error('❌ Token debug failed:', err)
    }
    return null
  }, [token])

  /**
   * Get global permissions (for troubleshooting)
   */
  const getPermissions = useCallback(async () => {
    if (!token) return null

    try {
      const result = await userService.getGlobalPermissions(token)
      if (result.success) {
        console.log('🔑 User permissions:', result.data)
        return result.data
      }
    } catch (err) {
      console.error('❌ Permissions fetch failed:', err)
    }
    return null
  }, [token])

  /**
   * Refresh profile data
   */
  const refreshProfile = useCallback(() => {
    return fetchProfile(true)
  }, [fetchProfile])

  // Auto-fetch profile when token becomes available
  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    loading,
    error,
    initialized,
    refreshProfile,
    debugToken,
    getPermissions,
    // Convenience accessors
    user: profile?.profile || null,
    organizations: profile?.organizations || [],
    globalRole: profile?.profile?.global_role || 'viewer',
    hasProfile: !!profile,
  }
}

export default useUserProfile