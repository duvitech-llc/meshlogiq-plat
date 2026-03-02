import { Link } from "react-router";
import { Fragment } from 'react';
import { Dropdown, DropdownDivider, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap';
import { TbChevronDown, TbUserCircle, TbBellRinging, TbSettings2, TbLogout2 } from 'react-icons/tb';
import user3 from '@/assets/images/users/user-3.jpg';
import { useAuthContext } from '@/contexts/AuthContext'

const UserProfile = () => {
  const { keycloak, logout, globalRole, organizations } = useAuthContext()
  const username = keycloak?.tokenParsed?.preferred_username || 'User'
  const isOwner = globalRole === 'owner' || (organizations || []).some((org) => org.role === 'owner')

  const userDropdownItems = [{
    label: 'User Menu',
    isHeader: true
  }, {
    label: 'Profile',
    icon: TbUserCircle,
    url: '/profile'
  }, {
    label: 'Notifications',
    icon: TbBellRinging,
    url: '/notifications'
  }, ...(isOwner ? [{
    label: 'Account',
    icon: TbSettings2,
    url: '/account'
  }] : []), {
    isDivider: true
  }, {
    label: 'Log Out',
    icon: TbLogout2,
    url: '#',
    class: 'text-danger fw-semibold'
  }];

  const handleItemClick = (item) => {
    if (item.label === 'Log Out') {
      logout()
    }
  }

  return <div className="topbar-item nav-user">
      <Dropdown align="end">
        <DropdownToggle as={'a'} className="topbar-link dropdown-toggle drop-arrow-none px-2">
          <img src={user3} width="32" height="32" className="rounded-circle me-lg-2 d-flex" alt="user-image" />
          <div className="d-lg-flex align-items-center gap-1 d-none">
            <h5 className="my-0">{username}</h5>
            <TbChevronDown className="align-middle" />
          </div>
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          {userDropdownItems.map((item, idx) => <Fragment key={idx}>
              {item.isHeader ? <div className="dropdown-header noti-title">
                  <h6 className="text-overflow m-0">{item.label}</h6>
                </div> : item.isDivider ? <DropdownDivider /> : <DropdownItem as={item.label === 'Log Out' ? 'button' : Link} to={item.label === 'Log Out' ? undefined : item.url ?? ''} className={item.class} onClick={() => handleItemClick(item)}>
                  {item.icon && <item.icon className="me-2 fs-17 align-middle" />}
                  <span className="align-middle">{item.label}</span>
                </DropdownItem>}
            </Fragment>)}
        </DropdownMenu>
      </Dropdown>
    </div>;
};
export default UserProfile;