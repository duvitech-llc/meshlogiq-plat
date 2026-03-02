import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../contexts/AuthContext'

export const PrivateRoute = ({ children }) => {
  const { 
    kcReady, 
    token, 
    profileLoading, 
    profileInitialized, 
    profileError,
    isFullyLoaded 
  } = useAuthContext()

  // Show loading while Keycloak initializes
  if (!kcReady) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Initializing authentication...</p>
          </div>
        </div>
      </div>
    )
  }

  // Redirect to login if no token
  if (!token) {
    return <Navigate to="/" replace />
  }

  // Show loading while profile loads
  if (profileLoading || !profileInitialized) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading your profile...</p>
            {profileError && (
              <div className="alert alert-warning mt-3">
                <strong>Profile Error:</strong> {profileError}
                <br />
                <small>You may still access the application, but some features might not work correctly.</small>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return children
}
