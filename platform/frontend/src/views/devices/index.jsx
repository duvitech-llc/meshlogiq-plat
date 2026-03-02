import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Container, Form, Modal, ProgressBar, Row, Spinner, Table } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { useAuthContext } from '@/contexts/AuthContext'
import { deviceService } from '@/services/deviceService'

const DevicesView = () => {
  const { token, organizations } = useAuthContext()
  const [selectedOrgUuid, setSelectedOrgUuid] = useState('')
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [uid, setUid] = useState('')
  const [name, setName] = useState('')
  const [meta, setMeta] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [createSuccess, setCreateSuccess] = useState(null)
  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)

  useEffect(() => {
    if (!selectedOrgUuid && organizations?.length) {
      setSelectedOrgUuid(organizations[0].uuid)
    }
  }, [organizations, selectedOrgUuid])

  const selectedOrg = useMemo(() => {
    return organizations?.find((org) => org.uuid === selectedOrgUuid) || null
  }, [organizations, selectedOrgUuid])

  const loadDevices = async () => {
    if (!token || !selectedOrg) return
    setLoading(true)
    setError(null)
    const result = await deviceService.listDevices(token, selectedOrg.slug)
    if (result.success) {
      setDevices(result.data?.results || [])
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadDevices()
  }, [token, selectedOrgUuid])

  const handleCreate = async () => {
    if (!selectedOrg) return

    setCreateLoading(true)
    setCreateError(null)
    setCreateSuccess(null)

    let metaPayload
    if (meta.trim()) {
      try {
        metaPayload = JSON.parse(meta)
      } catch (err) {
        setCreateError('Metadata must be valid JSON')
        setCreateLoading(false)
        return
      }
    }

    const payload = {
      uid,
      name: name || undefined,
      ...(metaPayload ? { meta: metaPayload } : {}),
    }

    const result = await deviceService.createDevice(token, selectedOrg.slug, payload)
    if (result.success) {
      setCreateSuccess(`Device ${result.data.uid} onboarded.`)
      setUid('')
      setName('')
      setMeta('')
      setWizardStep(1)
      setShowWizard(false)
      await loadDevices()
    } else {
      setCreateError(result.error)
    }

    setCreateLoading(false)
  }

  return (
    <Container fluid>
      <PageBreadcrumb title={'Devices'} />

      {!organizations?.length && (
        <Alert variant="warning" className="mt-3">
          You are not a member of any organization yet.
        </Alert>
      )}

      {organizations?.length > 0 && (
        <Row className="mb-4">
          <Col lg={6}>
            <Form.Group>
              <Form.Label>Organization</Form.Label>
              <Form.Select
                value={selectedOrgUuid}
                onChange={(e) => setSelectedOrgUuid(e.target.value)}
              >
                {organizations.map((org) => (
                  <option key={org.uuid} value={org.uuid}>
                    {org.name} ({org.role})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      )}

      {selectedOrg && (
        <Row className="g-4">
          <Col lg={12}>
            <Card>
              <Card.Header className="d-flex align-items-center justify-content-between">
                <h5 className="mb-0">Devices</h5>
                <div className="d-flex align-items-center gap-2">
                  {loading && <Spinner size="sm" />}
                  <Button size="sm" onClick={() => setShowWizard(true)}>Add device</Button>
                </div>
              </Card.Header>
              <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {createSuccess && <Alert variant="success">{createSuccess}</Alert>}
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>UID</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((device) => (
                      <tr key={device.id}>
                        <td>{device.uid}</td>
                        <td>{device.name}</td>
                        <td>
                          <Badge bg={device.is_active ? 'success' : 'secondary'}>
                            {device.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>{new Date(device.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {!devices.length && !loading && (
                  <div className="text-muted">No devices yet.</div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Modal show={showWizard} onHide={() => setShowWizard(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Onboard device</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ProgressBar now={(wizardStep / 2) * 100} className="mb-3" />

          {wizardStep === 1 && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Device UID</Form.Label>
                <Form.Control
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="e.g. sensor-001"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Name (optional)</Form.Label>
                <Form.Control
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Temperature Sensor"
                />
              </Form.Group>
            </Form>
          )}

          {wizardStep === 2 && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Metadata (optional JSON)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={meta}
                  onChange={(e) => setMeta(e.target.value)}
                  placeholder='{"location":"Warehouse A","model":"MX100"}'
                />
                <Form.Text className="text-muted">
                  Add device capabilities, tags, or hardware details.
                </Form.Text>
              </Form.Group>
            </Form>
          )}

          {createError && <Alert variant="danger">{createError}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowWizard(false)}>
            Cancel
          </Button>
          {wizardStep > 1 && (
            <Button variant="outline-primary" onClick={() => setWizardStep(wizardStep - 1)}>
              Back
            </Button>
          )}
          {wizardStep < 2 ? (
            <Button onClick={() => setWizardStep(2)} disabled={!uid}>
              Next
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={createLoading}>
              {createLoading ? 'Onboarding…' : 'Create device'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default DevicesView
