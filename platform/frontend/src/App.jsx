import { BrowserRouter } from 'react-router-dom'
import { AppProvidersWrapper } from './components/AppProvidersWrapper'
import { AllRoutes } from './routes'
import './assets/scss/app.scss'

export default function App() {
  return (
    <AppProvidersWrapper>
      <BrowserRouter>
        <AllRoutes />
      </BrowserRouter>
    </AppProvidersWrapper>
  )
}