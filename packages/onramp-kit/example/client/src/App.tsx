import AppBar from './AppBar'
import { Outlet } from 'react-router-dom'
import { AuthProvider } from './AuthContext'

function App() {
  return (
    <AuthProvider>
      <AppBar />
      <Outlet />
    </AuthProvider>
  )
}

export default App
