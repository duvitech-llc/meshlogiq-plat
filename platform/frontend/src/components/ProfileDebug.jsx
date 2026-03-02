/**
 * Profile Debug Component - Shows authentication and profile status
 * Useful for testing and debugging the Keycloak integration
 */
import { useState } from 'react'
import { Card, Button, Badge, Accordion, Alert } from 'react-bootstrap'
import { useAuthContext } from '../contexts/AuthContext'

const ProfileDebug = () => {
  const {
    keycloakUser,
    user,
    profile,
    organizations,
    globalRole,
    token,
    profileError,
    debugToken,
    getPermissions,
    refreshProfile,
    isAuthenticated,
    isFullyLoaded,
  } = useAuthContext()

  const [debugInfo, setDebugInfo] = useState(null)
  const [permissions, setPermissions] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleDebugToken = async () => {
    setLoading(true)
    try {
      const info = await debugToken()
      setDebugInfo(info)
    } catch (error) {
      console.error('Debug failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGetPermissions = async () => {
    setLoading(true)
    try {
      const perms = await getPermissions()
      setPermissions(perms)
    } catch (error) {
      console.error('Permissions failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'owner': return 'primary'
      case 'admin': return 'danger'
      case 'developer': return 'warning'
      case 'viewer': return 'secondary'
      default: return 'light'
    }
  }

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">
          🔐 Authentication Status
          {isAuthenticated && <Badge bg="success" className="ms-2">Authenticated</Badge>}
          {isFullyLoaded && <Badge bg="info" className="ms-2">Profile Loaded</Badge>}
        </h5>
      </Card.Header>
      <Card.Body>
        {profileError && (
          <Alert variant="warning" className="mb-3">
            <strong>Profile Error:</strong> {profileError}
          </Alert>
        )}

        <Accordion defaultActiveKey="0">
          {/* Basic Info */}
          <Accordion.Item eventKey="0">
            <Accordion.Header>Basic Information</Accordion.Header>
            <Accordion.Body>
              <div className="row">
                <div className="col-md-6">
                  <h6>Keycloak Token Info</h6>
                  <ul className="list-unstyled">
                    <li><strong>Subject:</strong> {keycloakUser?.sub || 'N/A'}</li>
                    <li><strong>Email:</strong> {keycloakUser?.email || 'N/A'}</li>
                    <li><strong>Name:</strong> {keycloakUser?.name || 'N/A'}</li>
                    <li><strong>Username:</strong> {keycloakUser?.preferred_username || 'N/A'}</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>Backend Profile</h6>
                  {user ? (
                    <ul className="list-unstyled">
                      <li><strong>ID:</strong> {user.id}</li>
                      <li><strong>Email:</strong> {user.email || 'N/A'}</li>
                      <li><strong>Display Name:</strong> {user.display_name || 'N/A'}</li>
                      <li>
                        <strong>Global Role:</strong>{' '}
                        <Badge bg={getRoleBadgeVariant(globalRole)}>{globalRole}</Badge>
                      </li>
                    </ul>
                  ) : (
                    <p className="text-muted">No profile loaded</p>
                  )}
                </div>
              </div>
            </Accordion.Body>
          </Accordion.Item>

          {/* Organizations */}
          <Accordion.Item eventKey="1">
            <Accordion.Header>
              Organizations ({organizations?.length || 0})
            </Accordion.Header>
            <Accordion.Body>
              {organizations && organizations.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Role</th>
                        <th>Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {organizations.map((org) => (
                        <tr key={org.id}>
                          <td>{org.name}</td>
                          <td><code>{org.slug}</code></td>
                          <td>
                            <Badge bg={getRoleBadgeVariant(org.role)}>{org.role}</Badge>
                          </td>
                          <td>
                            {org.is_active ? (
                              <Badge bg="success">Active</Badge>
                            ) : (
                              <Badge bg="secondary">Inactive</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">No organizations found</p>
              )}
            </Accordion.Body>
          </Accordion.Item>

          {/* Debug Actions */}
          <Accordion.Item eventKey="2">
            <Accordion.Header>Debug Tools</Accordion.Header>
            <Accordion.Body>
              <div className="d-flex gap-2 mb-3">
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={handleDebugToken}
                  disabled={loading || !token}
                >
                  Debug Token
                </Button>
                <Button 
                  variant="outline-info" 
                  size="sm" 
                  onClick={handleGetPermissions}
                  disabled={loading || !token}
                >
                  Get Permissions
                </Button>
                <Button 
                  variant="outline-success" 
                  size="sm" 
                  onClick={refreshProfile}
                  disabled={loading || !token}
                >
                  Refresh Profile
                </Button>
              </div>

              {debugInfo && (
                <div className="mb-3">
                  <h6>Token Debug Info</h6>
                  <pre className="bg-light p-2 rounded small">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              )}

              {permissions && (
                <div className="mb-3">
                  <h6>Permission Test Results</h6>
                  <pre className="bg-light p-2 rounded small">
                    {JSON.stringify(permissions, null, 2)}
                  </pre>
                </div>
              )}

              <div className="small text-muted">
                <p><strong>Token Preview:</strong></p>
                <code className="d-block text-break">
                  {token ? `${token.substring(0, 50)}...` : 'No token'}
                </code>
              </div>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Card.Body>
    </Card>
  )
}

export default ProfileDebug