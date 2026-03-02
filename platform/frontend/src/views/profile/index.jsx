import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { useAuthContext } from '@/contexts/AuthContext'
import { userService } from '@/services/userService'

const ProfileView = () => {
  const { token, user, refreshProfile, keycloak } = useAuthContext()
  const [form, setForm] = useState({
    display_name: '',
    first_name: '',
    last_name: '',
    phone: '',
    job_title: '',
    department: '',
    bio: '',
    timezone: 'UTC',
    locale: 'en-US',
    date_format: 'YYYY-MM-DD',
    time_format: '24h',
    email_notifications: true,
    push_notifications: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (!user) return
    setForm({
      display_name: user.display_name || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      job_title: user.job_title || '',
      department: user.department || '',
      bio: user.bio || '',
      timezone: user.timezone || 'UTC',
      locale: user.locale || 'en-US',
      date_format: user.date_format || 'YYYY-MM-DD',
      time_format: user.time_format || '24h',
      email_notifications: user.email_notifications ?? true,
      push_notifications: user.push_notifications ?? true,
    })
  }, [user])

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?.uuid) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    const result = await userService.updateProfile(token, user.uuid, form)
    if (result.success) {
      setSuccess('Profile updated.')
      await refreshProfile()
    } else {
      setError(result.error)
    }

    setSaving(false)
  }

  return (
    <Container fluid>
      <PageBreadcrumb title={'Profile'} />

      <Row>
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Your profile</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Display name</Form.Label>
                      <Form.Control
                        value={form.display_name}
                        onChange={(e) => updateField('display_name', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        value={form.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>First name</Form.Label>
                      <Form.Control
                        value={form.first_name}
                        onChange={(e) => updateField('first_name', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Last name</Form.Label>
                      <Form.Control
                        value={form.last_name}
                        onChange={(e) => updateField('last_name', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Job title</Form.Label>
                      <Form.Control
                        value={form.job_title}
                        onChange={(e) => updateField('job_title', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Department</Form.Label>
                      <Form.Control
                        value={form.department}
                        onChange={(e) => updateField('department', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Bio</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        value={form.bio}
                        onChange={(e) => updateField('bio', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Timezone</Form.Label>
                      <Form.Control
                        value={form.timezone}
                        onChange={(e) => updateField('timezone', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Locale</Form.Label>
                      <Form.Control
                        value={form.locale}
                        onChange={(e) => updateField('locale', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Date format</Form.Label>
                      <Form.Control
                        value={form.date_format}
                        onChange={(e) => updateField('date_format', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Time format</Form.Label>
                      <Form.Select
                        value={form.time_format}
                        onChange={(e) => updateField('time_format', e.target.value)}
                      >
                        <option value="24h">24h</option>
                        <option value="12h">12h</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Email notifications</Form.Label>
                      <Form.Check
                        type="switch"
                        checked={form.email_notifications}
                        onChange={(e) => updateField('email_notifications', e.target.checked)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Push notifications</Form.Label>
                      <Form.Check
                        type="switch"
                        checked={form.push_notifications}
                        onChange={(e) => updateField('push_notifications', e.target.checked)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                {success && <Alert variant="success" className="mt-3">{success}</Alert>}

                <Button type="submit" className="mt-3" disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Account details</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-2">Username and email are managed by Keycloak.</p>
              <div className="text-muted small">Username: {keycloak?.tokenParsed?.preferred_username || '—'}</div>
              <div className="text-muted small">Email: {user?.email}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default ProfileView
