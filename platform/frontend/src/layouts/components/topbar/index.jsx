import { Link } from 'react-router-dom'
import LanguageDropdown from './components/LanguageDropdown';
import ThemeToggler from './components/ThemeToggler';
import UserProfile from './components/UserProfile'
import { Container, FormControl } from 'react-bootstrap';
import { LuSearch } from 'react-icons/lu';
import { TbMenu4 } from 'react-icons/tb'
import logoLight from '@/assets/images/logo-light.png'
import logoDark from '@/assets/images/logo-dark.png'
import logoSmLight from '@/assets/images/logo-sm-light.png'
import logoSmDark from '@/assets/images/logo-sm-dark.png'
import FullscreenToggle from './components/FullscreenToggle';

const Topbar = ({ onToggleSidenav }) => {
  return (
    <header className="app-topbar">
      <Container fluid className="topbar-menu">
        <div className="d-flex align-items-center gap-2">
          <div className="logo-topbar">
            <Link to="/dashboard" className="logo-light">
              <span className="logo-lg">
                <img src={logoLight} alt="logo" height="32" />
              </span>
              <span className="logo-sm">
                <img src={logoSmLight} alt="small logo" />
              </span>
            </Link>
          </div>

          <button onClick={onToggleSidenav} className="sidenav-toggle-button btn btn-default btn-icon">
            <TbMenu4 className="fs-22" />
          </button>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="app-search d-none d-xl-flex me-2">
            <FormControl type="search" className="topbar-search rounded-pill" name="search" placeholder="Quick Search..." />
            <LuSearch className="app-search-icon text-muted" />
          </div>

          <LanguageDropdown />

          <ThemeToggler />

          <FullscreenToggle />

          <UserProfile />

        </div>
      </Container>
    </header>
  )
}

export default Topbar
