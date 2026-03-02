import { Badge, Button, Card, Col, Container, ListGroup, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'

const notifications = [
  {
    id: 'noti-1',
    title: 'Device sensor-001 connected',
    body: 'Heartbeat received from sensor-001 in Warehouse A.',
    time: 'Just now',
    unread: true,
  },
  {
    id: 'noti-2',
    title: 'Firmware update scheduled',
    body: 'Update queued for 4 devices in the logistics fleet.',
    time: 'Today, 10:24 AM',
    unread: false,
  },
  {
    id: 'noti-3',
    title: 'New invite accepted',
    body: 'A new user joined your organization as viewer.',
    time: 'Yesterday',
    unread: false,
  },
]

const NotificationsView = () => {
  return (
    <Container fluid>
      <PageBreadcrumb title={'Notifications'} />

      <Row className="g-3">
        <Col lg={8}>
          <Card>
            <Card.Header className="d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Inbox</h5>
              <Button size="sm" variant="outline-secondary">Mark all as read</Button>
            </Card.Header>
            <ListGroup variant="flush">
              {notifications.map((item) => (
                <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-semibold">
                      {item.title}{' '}
                      {item.unread && <Badge bg="primary">New</Badge>}
                    </div>
                    <div className="text-muted small">{item.body}</div>
                  </div>
                  <div className="text-muted small">{item.time}</div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Filters</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-0">
                Add filters, alert preferences, and routing rules here.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default NotificationsView
