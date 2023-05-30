import { Outlet } from 'react-router-dom'

import AppBar from './AppBar'

function App() {
  return (
    <>
      <AppBar />
      <Outlet />
    </>
  )
}

export default App
