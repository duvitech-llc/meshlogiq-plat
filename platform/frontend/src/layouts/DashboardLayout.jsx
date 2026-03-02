import { LayoutProvider, useLayoutContext } from '../contexts/useLayoutContext'
import Topbar from './components/topbar'
import Sidenav from './components/sidenav'
import Footer from './components/footer'

const DashboardLayoutContent = ({ children }) => {
  const { sidenav, changeSideNavSize, showBackdrop, hideBackdrop } = useLayoutContext()

  const toggleSidebar = () => {
    const html = document.documentElement
    const isOffcanvas = sidenav.size === 'offcanvas'

    if (isOffcanvas) {
      const willOpen = !html.classList.contains('sidebar-enable')
      html.classList.toggle('sidebar-enable')
      if (willOpen) {
        showBackdrop()
      } else {
        hideBackdrop()
      }
      return
    }

    const nextSize = sidenav.size === 'condensed' ? 'default' : 'condensed'
    changeSideNavSize(nextSize)
  }

  const closeSidebar = () => {
    const html = document.documentElement
    html.classList.remove('sidebar-enable')
    hideBackdrop()
  }

  return (
    <div className="wrapper">
      <Sidenav onClose={closeSidebar} />
      <Topbar onToggleSidenav={toggleSidebar} />
      <div className="content-page">
        <div className="content">
          {children}
        </div>
        <Footer />
      </div>
    </div>
  )
}

const DashboardLayout = ({ children }) => (
  <LayoutProvider>
    <DashboardLayoutContent>{children}</DashboardLayoutContent>
  </LayoutProvider>
)

export default DashboardLayout
