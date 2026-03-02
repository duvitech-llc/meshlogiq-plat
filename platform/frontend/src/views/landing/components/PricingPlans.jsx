import { Button, Card, CardBody, CardFooter, Col, Container, Row } from 'react-bootstrap';
import { TbCheck, TbX } from 'react-icons/tb';
const PricingPlans = () => {
  const pricingPlans = [{
    name: "Starter Plan",
    description: "Best for small deployments and testing",
    price: 49,
    projects: "Up to 100 devices",
    features: [{
      text: "100 connected devices",
      included: true
    }, {
      text: "Basic analytics dashboard",
      included: true
    }, {
      text: "Email support",
      included: true
    }, {
      text: "No advanced analytics",
      included: false
    }, {
      text: "No custom integrations",
      included: false
    }],
    buttonText: "Choose Starter",
    buttonVariant: "btn-outline-primary"
  }, {
    name: "Professional",
    description: "Ideal for growing IoT deployments",
    price: 199,
    projects: "Up to 1,000 devices",
    features: [{
      text: "1,000 connected devices",
      included: true
    }, {
      text: "Advanced analytics & insights",
      included: true
    }, {
      text: "API access & webhooks",
      included: true
    }, {
      text: "Priority support",
      included: true
    }, {
      text: "Custom integrations",
      included: false
    }],
    buttonText: "Choose Professional",
    buttonVariant: "btn-light",
    isPopular: true
  }, {
    name: "Enterprise",
    description: "For large-scale IoT operations",
    price: 499,
    projects: "Unlimited devices",
    features: [{
      text: "Unlimited connected devices",
      included: true
    }, {
      text: "White-label options",
      included: true
    }, {
      text: "Custom integrations & APIs",
      included: true
    }, {
      text: "24/7 dedicated support",
      included: true
    }, {
      text: "SLA guarantees",
      included: true
    }],
    buttonText: "Choose Enterprise",
    buttonVariant: "btn-dark"
  }];
  return <section className="section-custom" id="plans">
      <Container>
        <Row>
          <Col xs={12} className="text-center">
            <span className="text-muted rounded-3 d-inline-block">💰 Simple &amp; Transparent Plans</span>
            <h2 className="mt-3 fw-bold mb-5">Choose the <span className="text-primary">Pricing</span> Plan That Fits Your Needs</h2>
          </Col>
        </Row>
        <Row className="justify-content-center">
          <Col xxl={11}>
            <Row>
              {pricingPlans.map((item, idx) => <Col lg={4} key={idx}>
                    <Card className={`  ${item.isPopular ? 'text-bg-primary' : 'bg-light border bg-opacity-40 border-dashed shadow-none'}  h-100 my-4 my-lg-0`}>
                      <CardBody className="p-lg-4 pb-0 text-center">
                        <h3 className="fw-bold mb-1">{item.name}</h3>
                        <p className="text-muted mb-0">{item.description}</p>
                        <div className="my-4">
                          <h1 className="display-6 fw-bold mb-0">${item.price}</h1>
                          <small className="d-block text-muted fs-base">Billed monthly</small>
                          <small className="d-block text-muted">{item.projects}</small>
                        </div>
                        <ul className="list-unstyled text-start fs-sm mb-0">
                          {item.features.map((feature, idx) => <li className="mb-2" key={idx}>{feature.included ? <TbCheck className="text-success me-2" /> : <TbX className="text-danger me-2" />}  {feature.text}</li>)}
                        </ul>
                      </CardBody>
                      <CardFooter className="bg-transparent px-5 pb-4">
                        <Button className={`w-100 py-2 fw-semibold rounded-pill ${item.buttonVariant}`}>{item.buttonText}</Button>
                      </CardFooter>
                    </Card>
                  </Col>)}
            </Row>
          </Col>
        </Row>
      </Container>
    </section>;
};
export default PricingPlans;