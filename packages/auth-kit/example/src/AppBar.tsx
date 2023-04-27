import { AppBar as MuiAppBar, Typography, styled, Box, Button } from '@mui/material'
import { SafeGetUserInfoResponse, Web3AuthModalPack } from '../../src'

type AppBarProps = {
  isLoggedIn: boolean
  onLogin: () => void
  onLogout: () => void
  userInfo?: SafeGetUserInfoResponse<Web3AuthModalPack>
}

const AppBar = ({ isLoggedIn, onLogin, onLogout, userInfo }: AppBarProps) => {
  return (
    <StyledAppBar position="static" color="default">
      <Typography variant="h3" pl={4} fontWeight={700}>
        Auth Provider Demo
      </Typography>

      <Box mr={5}>
        {isLoggedIn ? (
          <Box display="flex" alignItems="center">
            {userInfo && (
              <Typography variant="body1" fontWeight={700}>
                Hello {userInfo.name || userInfo.email} !!
              </Typography>
            )}
            <Button variant="contained" onClick={onLogout} sx={{ ml: 2 }}>
              Log Out
            </Button>
          </Box>
        ) : (
          <Button variant="contained" onClick={onLogin}>
            Login
          </Button>
        )}
      </Box>
    </StyledAppBar>
  )
}

const StyledAppBar = styled(MuiAppBar)`
  && {
    position: sticky;
    top: 0;
    background: ${({ theme }) => theme.palette.background.paper};
    height: 70px;
    align-items: center;
    justify-content: space-between;
    flex-direction: row;
    border-bottom: 2px solid ${({ theme }) => theme.palette.background.paper};
    box-shadow: none;
  }
`

export default AppBar
