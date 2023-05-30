import React from 'react'
import ReactDOM from 'react-dom/client'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { SafeThemeProvider } from '@safe-global/safe-react-components'
import Web3AuthModal from './components/Web3AuthModal'
import MagicConnect from './components/MagicConnect'

import App from './App'

import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Navigate to="/web3auth" replace />,
        index: true
      },
      {
        path: '/web3auth',
        element: <Web3AuthModal />
      },
      {
        path: 'magic-connect',
        element: <MagicConnect />
      }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SafeThemeProvider mode="dark">
      {(safeTheme) => (
        <ThemeProvider theme={safeTheme}>
          <CssBaseline />
          <RouterProvider router={router} />
        </ThemeProvider>
      )}
    </SafeThemeProvider>
  </React.StrictMode>
)
