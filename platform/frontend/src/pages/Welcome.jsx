 // src/pages/Welcome.jsx
import { useEffect, useState } from 'react'
import keycloak from '../auth/keycloak'
import api from '../utils/api'
import 'bootstrap/dist/css/bootstrap.min.css'

export default function Welcome() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    (async () => {
      if (!keycloak.authenticated) {
        await keycloak.login({ redirectUri: window.location.href })
        return
      }
      try {
        const result = await api.get('/api/accounts/me/')
        setData(result)
      } catch (e) { setErr(String(e)) }
    })()
  }, [])

  if (err) return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="alert alert-danger" role="alert">
            <pre>{err}</pre>
          </div>
        </div>
      </div>
    </div>
  )

  if (!data) return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Setting things up...</span>
          </div>
          <p className="mt-3">Setting things up...</p>
        </div>
      </div>
    </div>
  )

  const org = data.organizations?.[0]
  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h1 className="card-title display-5">Welcome, {data.profile.display_name || data.profile.email} 🎉</h1>
              {org ? (
                <p className="lead">Your personal org is <strong>{org.name}</strong> (<code>{org.slug}</code>).</p>
              ) : (
                <p className="lead">We're preparing your workspace...</p>
              )}
              <a href="/" className="btn btn-primary">Go to dashboard</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}