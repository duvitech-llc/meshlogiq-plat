import { Col, Container, Row } from 'react-bootstrap';
import TestimonialCard from './TestimonialCard';
import user1 from '@/assets/images/users/user-1.jpg';
import user2 from '@/assets/images/users/user-2.jpg';
import user3 from '@/assets/images/users/user-3.jpg';
import client1 from '@/assets/images/clients/01.svg';
import client2 from '@/assets/images/clients/02.svg';
import client3 from '@/assets/images/clients/03.svg';
import client4 from '@/assets/images/clients/04.svg';
import client5 from '@/assets/images/clients/05.svg';
import client6 from '@/assets/images/clients/06.svg';
import client7 from '@/assets/images/clients/07.svg';
import { Link } from "react-router";
const Testimonials = () => {
  const testimonials = [{
    avatar: user1,
    title: 'Fantastic IoT platform!',
    description: 'MeshLogIQ made managing our 5000+ devices incredibly simple. The real-time monitoring is a game changer!'
  }, {
    avatar: user2,
    title: 'Excellent scalability & support',
    description: 'The platform scales effortlessly with our growing device network. Support team is responsive and knowledgeable!'
  }, {
    avatar: user3,
    title: 'Outstanding experience',
    description: 'From onboarding to deployment, everything was smooth. The analytics dashboard provides invaluable insights!'
  }];
  const clients = [client1, client2, client3, client4, client5, client6, client7];
  return <section className="section-custom position-relative overflow-hidden" id="reviews">
      <Container className="position-relative">
        <Row>
          <Col xs={12} className="text-center">
            <span className="text-muted rounded-3 d-inline-block">💬 Honest &amp; Verified Feedback</span>
            <h2 className="mt-3 fw-bold mb-5">Read Our <span className="text-primary">Customer Reviews</span> and Success Stories</h2>
          </Col>
        </Row>
        <Row className="justify-content-center">
          {testimonials.map((testimonial, idx) => <Col lg={4} key={idx}>
                <TestimonialCard testimonial={testimonial} />
              </Col>)}
        </Row>
        <Row className="justify-content-center mt-5">
          <Col xxl={9}>
            <div className="d-flex justify-content-center align-items-center flex-wrap gap-5 mt-4">
              {clients.map((logo, idx) => <div key={idx}>
                    <Link to="" className="d-block">
                      <img src={logo} alt="logo" height={42} />
                    </Link>
                  </div>)}
            </div>
          </Col>
        </Row>
      </Container>
    </section>;
};
export default Testimonials;