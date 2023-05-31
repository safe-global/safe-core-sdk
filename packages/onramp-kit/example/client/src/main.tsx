import ReactDOM from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { SafeThemeProvider } from '@safe-global/safe-react-components'

import Stripe from './components/Stripe'
import Monerium from './components/monerium/Monerium'
import App from './App'

import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Navigate to="/stripe" replace />,
        index: true
      },
      {
        path: '/stripe',
        element: <Stripe />
      },
      {
        path: 'monerium',
        element: <Monerium />
      }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <SafeThemeProvider mode="dark">
    {(safeTheme) => (
      <ThemeProvider theme={safeTheme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    )}
  </SafeThemeProvider>
)
