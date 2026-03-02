import { Link, useLocation } from 'react-router-dom'
import { TbLayoutDashboard, TbUsers, TbSettings, TbChartBar, TbListDetails, TbDevices } from 'react-icons/tb'
import { useAuthContext } from '@/contexts/AuthContext'

const AppMenu = () => {
  const { globalRole, organizations, keycloakUser } = useAuthContext()
  const location = useLocation()

  const orgHasAdminAccess = (organizations || []).some(
    (org) => org.role === 'owner' || org.role === 'admin'
  )
  const tokenRoles = keycloakUser?.realm_access?.roles || []
  const tokenHasAdminAccess = tokenRoles.includes('owner') || tokenRoles.includes('admin')
  const showUsersTab = globalRole === 'owner' || globalRole === 'admin' || orgHasAdminAccess || tokenHasAdminAccess

  const menuItems = [
    {
      label: 'Dashboard',
      icon: TbLayoutDashboard,
      path: '/dashboard',
    },
    {
      label: 'Devices',
      icon: TbDevices,
      path: '/devices',
    },
    ...(showUsersTab
      ? [{
          label: 'Users',
          icon: TbUsers,
          path: '/users',
        }]
      : []),
    {
      label: 'Analytics',
      icon: TbChartBar,
      path: '/analytics',
    },
    {
      label: 'Logs',
      icon: TbListDetails,
      path: '/logs',
    },
    {
      label: 'Settings',
      icon: TbSettings,
      path: '/settings',
    },
  ]

  return (
    <ul className="side-nav">
      <li className="side-nav-title">Navigation</li>
      {menuItems.map((item, idx) => {
        const Icon = item.icon
        const isActive = location.pathname === item.path
        return (
          <li key={idx} className="side-nav-item">
            <Link to={item.path} className={`side-nav-link ${isActive ? 'active' : ''}`}>
              <span className="menu-icon">
                <Icon />
              </span>
              <span className="menu-text">{item.label}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default AppMenu
