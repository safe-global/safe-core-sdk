import { Link as RouterLink } from 'react-router-dom'
import { AppBar as MuiAppBar, Typography, styled, Link } from '@mui/material'

const AppBar = () => {
  return (
    <StyledAppBar position="static" color="default">
      <Typography variant="h3" pl={3} fontWeight={700}>
        Auth Kit
      </Typography>
      <nav>
        <Link to={`/web3auth`} component={RouterLink} pl={2} sx={{ textDecoration: 'none' }}>
          Web3Auth Modal
        </Link>
        <Link to={`/magic-connect`} component={RouterLink} pl={2} sx={{ textDecoration: 'none' }}>
          Magic Connect
        </Link>
      </nav>
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
