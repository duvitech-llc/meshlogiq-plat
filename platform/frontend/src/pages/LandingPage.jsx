import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutProvider } from '../contexts/useLayoutContext';
import { useAuthContext } from '../contexts/AuthContext';
import Landing from '../views/landing';

export default function LandingPage() {
  const { token } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  return (
    <LayoutProvider>
      <Landing />
    </LayoutProvider>
  );
}
