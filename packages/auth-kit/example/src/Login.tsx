import { Typography, Box, Button } from '@mui/material'

type AppBarProps = {
  isLoggedIn: boolean
  onLogin: () => void
  onLogout: () => void
  userInfo?: any
}

const Login = ({ isLoggedIn, onLogin, onLogout, userInfo }: AppBarProps) => {
  return (
    <>
      <Box>
        {isLoggedIn ? (
          <Box display="flex" alignItems="center">
            {userInfo && (
              <Typography variant="body1" fontWeight={700}>
                Hello, {userInfo.name || userInfo.email} !!
              </Typography>
            )}
            <Button variant="contained" color="error" onClick={onLogout} sx={{ ml: 2 }}>
              Log Out
            </Button>
          </Box>
        ) : (
          <Button variant="contained" onClick={onLogin}>
            Login
          </Button>
        )}
      </Box>
    </>
  )
}

export default Login
