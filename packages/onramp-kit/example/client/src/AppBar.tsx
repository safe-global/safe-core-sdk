import { AppBar as MuiAppBar, Typography, styled, Link } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

const AppBar = () => {
  return (
    <StyledAppBar position="static" color="default">
      <Typography variant="h3" pl={4} fontWeight={700}>
        OnRamp Kit
      </Typography>
      <nav>
        <Link to={`/stripe`} component={RouterLink} pl={2} sx={{ textDecoration: 'none' }}>
          Stripe
        </Link>
        <Link to={`/monerium`} component={RouterLink} pl={2} sx={{ textDecoration: 'none' }}>
          Monerium
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
