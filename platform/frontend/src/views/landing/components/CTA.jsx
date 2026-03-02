import ctaImg from '@/assets/images/landing-cta.jpg';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from 'react-bootstrap';
const CTA = () => {
  const { signup } = useAuthContext();
  return <section>
      <div className="section-cta position-relative card-side-img overflow-hidden" style={{
      backgroundImage: `url(${ctaImg})`
    }}>
        <div className="card-img-overlay d-flex align-items-center flex-column gap-3 justify-content-center auth-overlay text-center">
          <h3 className="text-white fs-24 mb-0 fw-bold">
            Power Your IoT Infrastructure with MeshLogIQ
          </h3>
          <p className="text-white text-opacity-75 fs-md">
            Launch faster with a secure, scalable, and enterprise-ready IoT platform. <br /> Get started today — free 30-day trial, no credit card required.
          </p>
          <Button variant='light' className="rounded-pill" onClick={signup}>Get Started Now</Button>
        </div>
      </div>
    </section>;
};
export default CTA;