import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '../contexts/AuthContext'

/**
 * PrivateRoute — guards all authenticated pages.
 *
 * Props:
 *   requireProfile (bool, default true) — if false, renders children as soon
 *     as the token is present without waiting for the profile fetch to finish.
 *     Use this for post-auth landing pages like /welcome.
 */
export const PrivateRoute = ({ children, requireProfile = true }) => {
  const { 
    kcReady, 
    token, 
    profileLoading, 
    profileInitialized, 
    profileError,
  } = useAuthContext()
  const location = useLocation()

  // Show loading while Keycloak initializes
  if (!kcReady) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
          <p className="text-muted">Initializing authentication…</p>
        </div>
      </div>
    )
  }

  // Redirect to login, preserving the intended destination
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Optionally wait for the profile to finish loading
  if (requireProfile && (profileLoading || !profileInitialized)) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
          <p className="text-muted">Loading your profile…</p>
          {profileError && (
            <div className="alert alert-warning mt-3 text-start">
              <strong>Profile Error:</strong> {profileError}
              <br />
              <small>Some features may not work until this resolves.</small>
            </div>
          )}
        </div>
      </div>
    )
  }

  return children
}
