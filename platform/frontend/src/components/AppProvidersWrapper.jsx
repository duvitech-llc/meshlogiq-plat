import { CookiesProvider } from 'react-cookie'
import { AuthProvider } from '../contexts/AuthContext'

export const AppProvidersWrapper = ({ children }) => {
  return (
    <CookiesProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </CookiesProvider>
  )
}
