import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../contexts/AuthContext'
import { useLayoutContext } from '../contexts/useLayoutContext'
import logoDark from '../assets/images/logo-dark.png'
import logoLight from '../assets/images/logo-light.png'

export default function WelcomePage() {
  const { kcReady, isAuthenticated, keycloakUser, profileInitialized, profile } = useAuthContext()
  const { theme } = useLayoutContext()
  const navigate = useNavigate()

  // Not authenticated after Keycloak is ready → send to login
  useEffect(() => {
    if (kcReady && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [kcReady, isAuthenticated, navigate])

  // Derive a friendly display name
  const displayName =
    profile?.profile?.display_name ||
    keycloakUser?.given_name ||
    keycloakUser?.preferred_username ||
    'there'

  // Still waiting for Keycloak to finish the callback
  if (!kcReady) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
          <p className="text-muted">Completing sign up…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body">
      <div className="text-center px-4" style={{ maxWidth: 540 }}>

        {/* Logo */}
        <div className="mb-4">
          <img
            src={theme === 'dark' ? logoLight : logoDark}
            alt="MeshLogIQ"
            height="40"
          />
        </div>

        {/* Success icon */}
        <div className="mb-4">
          <span
            className="avatar-lg rounded-circle bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center"
            style={{ width: 80, height: 80 }}
          >
            <i className="ri-check-line text-success" style={{ fontSize: 40 }} />
          </span>
        </div>

        <h3 className="fw-bold mb-2">Welcome to MeshLogIQ, {displayName}!</h3>
        <p className="text-muted mb-4">
          Your account has been created. You&apos;re ready to connect devices,
          stream telemetry, and start building your IoT analytics platform.
        </p>

        {/* Quick-start steps */}
        <div className="card mb-4 text-start">
          <div className="card-body">
            <h6 className="fw-semibold mb-3">Get started in 3 steps</h6>
            <ol className="list-group list-group-numbered list-group-flush">
              <li className="list-group-item d-flex align-items-start gap-3 border-0 px-0 py-2">
                <div>
                  <div className="fw-semibold small">Connect a device</div>
                  <div className="text-muted small">Register an edge node or IoT gateway from the Devices page.</div>
                </div>
              </li>
              <li className="list-group-item d-flex align-items-start gap-3 border-0 px-0 py-2">
                <div>
                  <div className="fw-semibold small">Configure a pipeline</div>
                  <div className="text-muted small">Set up telemetry ingestion and analytics workflows.</div>
                </div>
              </li>
              <li className="list-group-item d-flex align-items-start gap-3 border-0 px-0 py-2">
                <div>
                  <div className="fw-semibold small">Monitor your fleet</div>
                  <div className="text-muted small">View live metrics, logs, and alerts from the dashboard.</div>
                </div>
              </li>
            </ol>
          </div>
        </div>

        <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
          <Link to="/dashboard" className="btn btn-primary btn-lg px-5">
            <i className="ri-dashboard-line me-2" />
            Go to Dashboard
          </Link>
          <Link to="/devices" className="btn btn-outline-secondary btn-lg px-4">
            Connect a Device
          </Link>
        </div>

      </div>
    </div>
  )
}
