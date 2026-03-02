import { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '../contexts/AuthContext'
import { useLayoutContext } from '../contexts/useLayoutContext'
import logoDark from '../assets/images/logo-dark.png'
import logoLight from '../assets/images/logo-light.png'
import bgIot from '../assets/images/bg-iot2.jpg'

export default function LoginPage() {
  const { keycloak, kcReady, isAuthenticated } = useAuthContext()
  const { theme } = useLayoutContext()
  const navigate = useNavigate()
  const location = useLocation()

  // Restore the page the user was trying to reach, or fall back to /dashboard
  const from = location.state?.from?.pathname || '/dashboard'

  // Already authenticated → bounce straight to the intended destination
  useEffect(() => {
    if (kcReady && isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [kcReady, isAuthenticated, navigate, from])

  const handleLogin = () => {
    keycloak.login({
      redirectUri: window.location.origin + from,
    })
  }

  return (
    <div className="d-flex min-vh-100">
      {/* ── Form panel ── */}
      <div className="col-lg-5 d-flex flex-column justify-content-center p-5 bg-body">
        <div className="mx-auto w-100" style={{ maxWidth: 420 }}>

          {/* Logo */}
          <div className="auth-brand mb-4">
            <Link to="/">
              <img
                src={theme === 'dark' ? logoLight : logoDark}
                alt="MeshLogIQ"
                height="32"
              />
            </Link>
          </div>

          <h4 className="fw-bold mb-1">Welcome back</h4>
          <p className="text-muted mb-4">
            Sign in to your MeshLogIQ account to manage your devices and data pipelines.
          </p>

          <div className="d-grid mb-4">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleLogin}
              disabled={!kcReady}
            >
              {kcReady ? (
                <>
                  <i className="ri-login-box-line me-2" />
                  Continue to Sign In
                </>
              ) : (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Initializing…
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-muted mb-0">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-primary fw-semibold">
                Create one free
              </Link>
            </p>
          </div>

          <hr className="my-4" />
          <p className="text-center text-muted small mb-0">
            You will be redirected to our secure identity provider (Keycloak) to complete sign in.
          </p>
        </div>
      </div>

      {/* ── Image panel ── */}
      <div
        className="col-lg-7 d-none d-lg-flex flex-column justify-content-end overflow-hidden position-relative"
        style={{
          backgroundImage: `url(${bgIot})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="auth-overlay w-100 p-5">
          <h3 className="text-white fw-bold mb-2">
            Edge-to-Cloud IoT Intelligence
          </h3>
          <p className="text-white-50 mb-0" style={{ maxWidth: 420 }}>
            Connect, monitor, and manage your entire device fleet from a single,
            secure platform — from Jetson edge nodes to cloud analytics pipelines.
          </p>
        </div>
      </div>
    </div>
  )
}
