import { useLayoutContext } from '@/contexts/useLayoutContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { Link } from "react-router";
import { useEffect, useState } from 'react';
import { Button, Container, Navbar, NavbarBrand, NavbarCollapse, NavbarToggle, NavLink } from 'react-bootstrap';
import { TbContrast } from 'react-icons/tb';
import logoDark from '@/assets/images/logo-dark.png';
import logoLight from '@/assets/images/logo-light.png';
const navItems = ['Home', 'Services', 'Features', 'Plans', 'Reviews', 'Contact'];
export default function Header() {
  const {
    theme,
    changeTheme
  } = useLayoutContext();
  const { login, signup } = useAuthContext();
  const [activeSection, setActiveSection] = useState("Home");
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      for (let section of navItems) {
        const element = document.getElementById(section.toLowerCase());
        if (element) {
          const {
            offsetTop,
            offsetHeight
          } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const toggleTheme = () => {
    if (theme === 'dark') {
      changeTheme('light');
      return;
    }
    changeTheme('dark');
    return;
  };
  const [isCollapsed, setIsCollapsed] = useState(true);
  return <header>
            <Navbar expand="lg" className={`py-2 sticky-top top-fixed`} id="landing-navbar">
                <Container>
                    <NavbarBrand className="auth-brand mb-0">
                        {theme === 'dark' ? (
                            <Link to="/" className="logo-dark">
                                <img src={logoLight} alt="light logo" height="32" />
                            </Link>
                        ) : (
                            <Link to="/" className="logo-light">
                                <img src={logoDark} alt="dark logo" height="32" />
                            </Link>
                        )}
                    </NavbarBrand>

                    <NavbarToggle aria-controls="navbarSupportedContent" onClick={() => setIsCollapsed(!isCollapsed)} />
                    <NavbarCollapse in={!isCollapsed} id="navbarSupportedContent">
                        <ul className="navbar-nav text-uppercase fw-bold gap-2 fs-sm mx-auto mt-2 mt-lg-0" id="navbar-example">
                            {navItems.map((item, idx) => <li className="nav-item" key={idx}>
                                    <NavLink className={`nav-link fs-xs ${activeSection == item ? "active" : ""}`} href={`#${item.toLowerCase()}`}>
                                        {item}
                                    </NavLink>
                                </li>)}
                        </ul>
                        <div className="d-flex gap-2">
                            <Button variant="link" className="btn-link btn-icon fw-semibold nav-link me-2" type="button" onClick={toggleTheme} id="theme-toggle">
                                <TbContrast className="fs-22" />
                            </Button>
                            <Button variant="outline-primary" size="sm" onClick={login}>
                                Sign In
                            </Button>
                            <Button variant="primary" size="sm" onClick={signup}>
                                Sign Up
                            </Button>
                        </div>
                    </NavbarCollapse>
                </Container>
            </Navbar>
        </header>;
}