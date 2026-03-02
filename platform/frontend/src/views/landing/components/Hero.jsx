import dashboardImg from "@/assets/images/dashboard.png";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button, Col, Container, Row } from "react-bootstrap";
const Hero = () => {
  const { login, signup } = useAuthContext();
  return <section className="bg-light bg-opacity-50 border-top border-light position-relative" id="home">
      <Container className="pt-5 mt-5 position-relative">
        <Row>
          <Col lg={8} className="mx-auto text-center">
            <h1 className="my-4 fs-36 fw-bold lh-base">
              Modern, Powerful &amp; Flexible <span className="text-primary">IoT Management Platform</span> –&nbsp;<span className="text-muted">Built for Connected Device Solutions</span>
            </h1>
            <p className="mb-4 fs-md text-muted lh-lg">
              Manage, monitor, and control your IoT devices with MeshLogIQ's comprehensive platform.
              Engineered for scalability, security, and seamless integration — ideal for enterprises and IoT solution providers.
            </p>
            <div className="d-flex gap-2 gap-sm-3 flex-wrap justify-content-center">
              <Button variant="primary" size="lg" className="py-2 fw-semibold" onClick={signup}>
                Get Started Now!
              </Button>
              <Button variant="outline-primary" size="lg" className="py-2 fw-semibold" onClick={login}>
                Sign In
              </Button>
            </div>
          </Col>
        </Row>
        <Container className="position-relative">
          <Row>
            <Col md={10} className="mx-auto position-relative">
              <img src={dashboardImg} className="rounded-top-4 img-fluid mt-5" alt="saas-img" />
            </Col>
          </Row>
        </Container>
      </Container>
    </section>;
};
export default Hero;