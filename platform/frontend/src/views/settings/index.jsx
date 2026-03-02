import { Card, Col, Container, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'

const SettingsView = () => {
  return (
    <Container fluid>
      <PageBreadcrumb title={'Settings'} />

      <Row className="g-3">
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Organization</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-0">
                Configure organization profile, branding, and contact details.
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Access & Roles</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-0">
                Manage role defaults, invitations, and approval workflows.
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Security</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-0">
                Authentication, session policies, and audit controls.
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Notifications</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-0">
                Email, alerts, and system event routing.
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Billing</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-0">
                Plans, invoices, and usage quotas.
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Integrations</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-0">
                Connect external services, webhooks, and API keys.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default SettingsView
