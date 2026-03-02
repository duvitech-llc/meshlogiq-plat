import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../contexts/AuthContext'
import { useLayoutContext } from '../contexts/useLayoutContext'
import logoDark from '../assets/images/logo-dark.png'
import logoLight from '../assets/images/logo-light.png'
import bgIot from '../assets/images/bg-iot2.jpg'

export default function SignupPage() {
  const { signup, kcReady, isAuthenticated } = useAuthContext()
  const { theme } = useLayoutContext()
  const navigate = useNavigate()

  // Already authenticated → bounce straight to dashboard
  useEffect(() => {
    if (kcReady && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [kcReady, isAuthenticated, navigate])

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

          <h4 className="fw-bold mb-1">Create your account</h4>
          <p className="text-muted mb-4">
            Join MeshLogIQ to connect devices, stream telemetry, and unlock
            AI-powered edge analytics.
          </p>

          {/* Feature highlights */}
          <ul className="list-unstyled mb-4">
            {[
              { icon: 'ri-cpu-line', text: 'Connect edge AI nodes instantly' },
              { icon: 'ri-line-chart-line', text: 'Real-time telemetry & analytics' },
              { icon: 'ri-shield-check-line', text: 'Multi-tenant, role-based access' },
            ].map(({ icon, text }) => (
              <li key={text} className="d-flex align-items-center gap-2 mb-2 text-muted small">
                <i className={`${icon} text-primary fs-16`} />
                {text}
              </li>
            ))}
          </ul>

          <div className="d-grid mb-4">
            <button
              className="btn btn-primary btn-lg"
              onClick={signup}
              disabled={!kcReady}
            >
              {kcReady ? (
                <>
                  <i className="ri-user-add-line me-2" />
                  Create Free Account
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
              Already have an account?{' '}
              <Link to="/login" className="text-primary fw-semibold">
                Sign In
              </Link>
            </p>
          </div>

          <hr className="my-4" />
          <p className="text-center text-muted small mb-0">
            You will be redirected to our secure identity provider to complete registration.
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
            Start managing your fleet today
          </h3>
          <p className="text-white-50 mb-0" style={{ maxWidth: 420 }}>
            From a single Raspberry Pi to thousands of edge AI nodes — MeshLogIQ
            scales with your deployment and keeps your data in your hands.
          </p>
        </div>
      </div>
    </div>
  )
}
