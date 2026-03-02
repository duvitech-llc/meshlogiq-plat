// src/pages/Signup.jsx
import keycloak from '../auth/keycloak'
import 'bootstrap/dist/css/bootstrap.min.css'

export default function Signup() {
  const go = () => keycloak.register({
    redirectUri: window.location.origin + '/welcome'
  })

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
      <div className="row w-100">
        <div className="col-md-6 mx-auto">
          <div className="card shadow-lg">
            <div className="card-body p-5">
              <h1 className="card-title text-center mb-4">Create your MeshLogIQ account</h1>
              <p className="text-center mb-4">Sign up to connect devices and start streaming data.</p>
              <button 
                onClick={go} 
                className="btn btn-primary w-100 py-2"
              >
                Create account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}