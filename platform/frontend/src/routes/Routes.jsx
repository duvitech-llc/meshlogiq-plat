import { Route, Routes, Navigate } from 'react-router-dom'
import { PrivateRoute } from './PrivateRoute'
import { Root } from './Root'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import SignupPage from '../pages/SignupPage'
import WelcomePage from '../pages/WelcomePage'
import Dashboard from '../pages/Dashboard'
import LogsPage from '../pages/Logs'
import UsersPage from '../pages/Users'
import SettingsPage from '../pages/Settings'
import DevicesPage from '../pages/Devices'
import AnalyticsPage from '../pages/Analytics'
import ProfilePage from '../pages/Profile'
import NotificationsPage from '../pages/Notifications'
import AccountPage from '../pages/Account'

export const AllRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Root />}>
        <Route index element={<LandingPage />} />
        {/* Auth routes — public, no PrivateRoute wrapper */}
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route
          path="welcome"
          element={
            <PrivateRoute requireProfile={false}>
              <WelcomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="logs"
          element={
            <PrivateRoute>
              <LogsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="analytics"
          element={
            <PrivateRoute>
              <AnalyticsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="users"
          element={
            <PrivateRoute>
              <UsersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="devices"
          element={
            <PrivateRoute>
              <DevicesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <PrivateRoute>
              <NotificationsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="account"
          element={
            <PrivateRoute>
              <AccountPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
