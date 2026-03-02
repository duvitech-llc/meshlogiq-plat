import { Link } from 'react-router-dom'
import { TbX } from 'react-icons/tb'
import SimpleBar from 'simplebar-react'
import logoLight from '@/assets/images/logo-light.png'
import logoSmLight from '@/assets/images/logo-sm-light.png'
import AppMenu from './components/AppMenu'

const Sidenav = ({ onClose }) => {
  return (
    <div className="sidenav-menu">
      <Link to="/dashboard" className="logo">
        <span className="logo logo-light">
          <span className="logo-lg">
            <img src={logoLight} alt="logo" />
          </span>
          <span className="logo-sm">
            <img src={logoSmLight} alt="small logo" />
          </span>
        </span>
      </Link>

      <button className="button-close-offcanvas" onClick={onClose}>
        <TbX className="align-middle" />
      </button>

      <SimpleBar id="sidenav" className="scrollbar">
        <AppMenu />
      </SimpleBar>
    </div>
  )
}

export default Sidenav
