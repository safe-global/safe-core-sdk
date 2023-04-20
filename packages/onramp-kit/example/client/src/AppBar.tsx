import {
  AppBar as MuiAppBar,
  Typography,
  styled,
  Link,
  Button,
  Box,
  MenuItem,
  Select,
  SelectChangeEvent
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { EthHashInfo } from '@safe-global/safe-react-components'

const AppBar = () => {
  const { logIn, logOut, isLoggedIn, data, selectedSafe, setSelectedSafe } = useAuth()

  return (
    <StyledAppBar position="static" color="default">
      <Typography variant="h3" pl={3} fontWeight={700}>
        OnRamp
      </Typography>
      <nav>
        <Link to={`/stripe`} component={RouterLink} pl={2} sx={{ textDecoration: 'none' }}>
          Stripe
        </Link>
        <Link to={`/monerium`} component={RouterLink} pl={2} sx={{ textDecoration: 'none' }}>
          Monerium
        </Link>
      </nav>
      <Box mr={5} display="flex" justifyContent="flex-end" alignItems="center" width="100%">
        {isLoggedIn ? (
          <>
            <EthHashInfo name="Owner" address={data?.eoa || ''} showCopyButton />

            {data && data?.safes && data?.safes?.length > 0 && (
              <Select
                value={selectedSafe}
                onChange={(event: SelectChangeEvent<string>) =>
                  setSelectedSafe?.(event.target.value)
                }
                sx={{ height: '54px' }}
              >
                first{' '}
                {data?.safes.map((safe, index) => (
                  <MenuItem key={safe} value={safe}>
                    <EthHashInfo name={`Safe ${index + 1}`} address={safe} showCopyButton />
                  </MenuItem>
                ))}
              </Select>
            )}

            <Button variant="contained" color="error" onClick={logOut} sx={{ ml: 2 }}>
              Disconnect
            </Button>
          </>
        ) : (
          <Button variant="contained" onClick={logIn}>
            Connect
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
    flex-direction: row;
    border-bottom: 2px solid ${({ theme }) => theme.palette.background.paper};
    box-shadow: none;
  }
`

export default AppBar
