import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { useAuthContext } from '@/contexts/AuthContext'
import { userService } from '@/services/userService'

const AccountView = () => {
  const { token, organizations, globalRole } = useAuthContext()
  const [selectedOrgUuid, setSelectedOrgUuid] = useState('')
  const [orgDetails, setOrgDetails] = useState(null)
  const [form, setForm] = useState({
    name: '',
    display_name: '',
    email: '',
    phone: '',
    website: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    tags: '',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const ownerOrgs = useMemo(
    () => (organizations || []).filter((org) => org.role === 'owner'),
    [organizations]
  )

  useEffect(() => {
    if (!selectedOrgUuid && ownerOrgs.length) {
      setSelectedOrgUuid(ownerOrgs[0].uuid)
    }
  }, [ownerOrgs, selectedOrgUuid])

  const selectedOrg = useMemo(() => {
    return ownerOrgs.find((org) => org.uuid === selectedOrgUuid) || null
  }, [ownerOrgs, selectedOrgUuid])

  const isOwner = globalRole === 'owner' || ownerOrgs.length > 0

  useEffect(() => {
    const fetchOrg = async () => {
      if (!token || !selectedOrg) return
      setLoading(true)
      setError(null)
      const result = await userService.getOrganization(token, selectedOrg.uuid)
      if (result.success) {
        setOrgDetails(result.data)
        setForm({
          name: result.data.name || '',
          display_name: result.data.display_name || '',
          email: result.data.email || '',
          phone: result.data.phone || '',
          website: result.data.website || '',
          address_line1: result.data.address_line1 || '',
          address_line2: result.data.address_line2 || '',
          city: result.data.city || '',
          state: result.data.state || '',
          postal_code: result.data.postal_code || '',
          country: result.data.country || '',
          tags: (result.data.tags || []).join(', '),
        })
      } else {
        setError(result.error)
      }
      setLoading(false)
    }

    fetchOrg()
  }, [token, selectedOrg])

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedOrg) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    const payload = {
      ...form,
      tags: form.tags
        ? form.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [],
    }

    const result = await userService.updateOrganization(token, selectedOrg.uuid, payload)
    if (result.success) {
      setSuccess('Account updated.')
      setOrgDetails(result.data)
    } else {
      setError(result.error)
    }
    setSaving(false)
  }

  return (
    <Container fluid>
      <PageBreadcrumb title={'Account'} />

      {!isOwner && (
        <Alert variant="danger">Only organization owners can access this page.</Alert>
      )}

      {isOwner && ownerOrgs.length === 0 && (
        <Alert variant="warning">You do not own any organizations.</Alert>
      )}

      {isOwner && (
        <Row className="g-3">
          <Col lg={8}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Organization profile</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Organization</Form.Label>
                        <Form.Select
                          value={selectedOrgUuid}
                          onChange={(e) => setSelectedOrgUuid(e.target.value)}
                        >
                          {ownerOrgs.map((org) => (
                            <option key={org.uuid} value={org.uuid}>
                              {org.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
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
                        <Form.Label>Legal name</Form.Label>
                        <Form.Control
                          value={form.name}
                          onChange={(e) => updateField('name', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          value={form.email}
                          onChange={(e) => updateField('email', e.target.value)}
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
                        <Form.Label>Website</Form.Label>
                        <Form.Control
                          value={form.website}
                          onChange={(e) => updateField('website', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Address line 1</Form.Label>
                        <Form.Control
                          value={form.address_line1}
                          onChange={(e) => updateField('address_line1', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Address line 2</Form.Label>
                        <Form.Control
                          value={form.address_line2}
                          onChange={(e) => updateField('address_line2', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>City</Form.Label>
                        <Form.Control
                          value={form.city}
                          onChange={(e) => updateField('city', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>State</Form.Label>
                        <Form.Control
                          value={form.state}
                          onChange={(e) => updateField('state', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Postal code</Form.Label>
                        <Form.Control
                          value={form.postal_code}
                          onChange={(e) => updateField('postal_code', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Country</Form.Label>
                        <Form.Control
                          value={form.country}
                          onChange={(e) => updateField('country', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={8}>
                      <Form.Group>
                        <Form.Label>Tags</Form.Label>
                        <Form.Control
                          value={form.tags}
                          onChange={(e) => updateField('tags', e.target.value)}
                          placeholder="iot, logistics, edge"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                  {success && <Alert variant="success" className="mt-3">{success}</Alert>}

                  <Button type="submit" className="mt-3" disabled={saving || loading}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Account status</h5>
              </Card.Header>
              <Card.Body>
                <div className="text-muted">Plan: {orgDetails?.plan || '—'}</div>
                <div className="text-muted">Status: {orgDetails?.status || '—'}</div>
                <div className="text-muted">Members: {orgDetails?.member_count ?? '—'}</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  )
}

export default AccountView
