import { Link } from "react-router";
import { Button, Col, Container, Row } from 'react-bootstrap';
import CountUp from "react-countup";
const stats1 = [{
  value: 99.90,
  suffix: '%',
  label: 'Platform uptime'
}, {
  value: 5,
  suffix: 'M+',
  label: 'Connected devices'
}, {
  value: 10000,
  suffix: '+',
  label: 'Messages per second'
}];
const stats2 = [{
  value: 99.50,
  suffix: '%',
  label: 'Data delivery success rate'
}, {
  value: 50,
  suffix: 'ms',
  label: 'Average latency'
}];
const Features = () => {
  return <section className="section-custom bg-light bg-opacity-30 border-top border-light border-bottom" id="features">
      <Container>
        <Row>
          <Col xs={12} className="text-center">
            <span className="text-muted rounded-3 d-inline-block">🚀 Designed for Performance &amp; Scalability</span>
            <h2 className="mt-3 fw-bold mb-5">Discover the Core <span className="text-primary">Features</span> of MeshLogIQ</h2>
          </Col>
        </Row>
        <Row className="align-items-center pb-5">
          <Col lg={6} xl={5} className="py-3">
            <div className="text-center">
              <img src="https://illustrations.popsy.co/violet/paper-plane.svg" className="rounded-3 img-fluid" alt="saas-img" />
              <small className="fst-italic">Image by: <a href="https://popsy.co/illustrations" target="_blank">Popsy.co</a></small>
            </div>
          </Col>
          <Col lg={5} className="ms-auto py-3">
            <h3 className="mb-3 fs-xl lh-base">Powering Smart IoT Experiences with MeshLogIQ</h3>
            <p className="mb-2 lead">MeshLogIQ is a feature-rich, high-performance IoT management platform built for modern connected device solutions and enterprise-grade deployments.</p>
            <p className="text-muted fs-sm mb-4">Streamline device operations, monitor real-time metrics, and manage your IoT infrastructure seamlessly with intuitive dashboards and powerful APIs.</p>
            <Button variant='primary' className="mb-4">Launch Dashboard</Button>
            <div className="d-flex flex-wrap justify-content-between gap-4 mt-4">
              {stats1.map((state, idx) => <div key={idx}>
                  <h3 className="mb-2">
                    <CountUp end={state.value} decimals={state.suffix === 'ms' ? 0 : 1} duration={2} enableScrollSpy scrollSpyOnce />
                    <span className="text-primary">{state.suffix}</span>
                  </h3>
                  <p className="text-muted mb-0">{state.label}</p>
                </div>)}
            </div>
          </Col>
        </Row>
        <Row className="align-items-center">
          <Col lg={5} className="py-3 order-2 order-lg-1">
            <h2 className="mb-3 fs-xl lh-base">Control Everything from One Unified Platform</h2>
            <p className="mb-2 lead">MeshLogIQ empowers teams with a smart, responsive interface to manage devices, analytics, configurations, and workflows effortlessly.</p>
            <p className="text-muted fs-sm mb-4">Track device performance, automate operations, and make data-driven decisions — all from a secure and scalable IoT platform.</p>
            <Link to="/" className="btn btn-primary mb-4">Explore MeshLogIQ Platform</Link>
            <div className="d-flex flex-wrap gap-4 mt-4">
              {stats2.map((state, idx) => <div key={idx}>
                  <h3 className="mb-2">
                    <CountUp end={state.value} decimals={state.suffix === 'ms' ? 0 : 1} duration={2} enableScrollSpy scrollSpyOnce />
                    <span className="text-primary">{state.suffix}</span>
                  </h3>
                  <p className="text-muted mb-0">{state.label}</p>
                </div>)}
            </div>
          </Col>
          <Col lg={6} xl={5} className="ms-auto py-3 order-1 order-lg-2">
            <div className="text-center">
              <img src="https://illustrations.popsy.co/violet/success.svg" className="rounded-3 img-fluid" alt="saas-img" />
            </div>
          </Col>
        </Row>
      </Container>
    </section>;
};
export default Features;