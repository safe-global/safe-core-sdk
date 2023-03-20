import { AppBar as MuiAppBar, Typography, styled } from '@mui/material'

const AppBar = () => {
  return (
    <StyledAppBar position="static" color="default">
      <Typography variant="h3" pl={4} fontWeight={700}>
        Payments Provider Demo
      </Typography>
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
