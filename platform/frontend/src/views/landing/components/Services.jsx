import { Col, Container, Row } from 'react-bootstrap';
import { TbDevices, TbCloud, TbShieldLock, TbChartBar, TbBell, TbApi } from 'react-icons/tb';
import ServiceCard from './ServiceCard';
const Services = () => {
  const services = [{
    name: "Device Management",
    description: "Seamlessly onboard, configure, and manage thousands of IoT devices from a single platform. Monitor device health and status in real-time.",
    icon: TbDevices
  }, {
    name: "Cloud Integration",
    description: "Connect your devices to the cloud with secure, scalable infrastructure. Support for multiple cloud providers and hybrid deployments.",
    icon: TbCloud
  }, {
    name: "Security & Compliance",
    description: "Enterprise-grade security with end-to-end encryption, secure authentication, and compliance with industry standards like ISO 27001.",
    icon: TbShieldLock
  }, {
    name: "Analytics & Insights",
    description: "Transform device data into actionable insights with real-time analytics, custom dashboards, and predictive maintenance capabilities.",
    icon: TbChartBar
  }, {
    name: "Alerts & Notifications",
    description: "Stay informed with intelligent alerting systems. Configure custom rules and receive notifications via email, SMS, or webhooks.",
    icon: TbBell
  }, {
    name: "API & Integration",
    description: "Robust REST APIs and SDKs for seamless integration with your existing systems. Extensive documentation and developer support.",
    icon: TbApi
  }];
  return <section className="section-custom pb-5" id="services">
      <Container className="container">
        <Row>
          <Col xs={12} className="text-center">
            <span className="text-muted rounded-3 d-inline-block">🔌 Comprehensive IoT Solutions</span>
            <h2 className="mt-3 fw-bold mb-5">Explore Our Platform <span className="text-primary">Features</span> and Capabilities</h2>
          </Col>
        </Row>
        <Row className="text-center">
          {services.map((service, idx) => <Col key={idx} xl={4} md={6}>
              <ServiceCard service={service} />
            </Col>)}
        </Row>
      </Container>
    </section>;
};
export default Services;