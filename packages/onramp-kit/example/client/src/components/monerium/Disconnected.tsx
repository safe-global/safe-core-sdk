import { Box, Typography } from '@mui/material'

function Disconnected() {
  return (
    <Box p={2}>
      <Typography variant="h5" color="primary">
        Connect
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Use the connect button in the header for using your regular wallet or Social providers in
        order to authenticate with an owner
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Once you connect you will see the owner and the associated Safes. Choose the one you want to
        link to Monerium
      </Typography>
    </Box>
  )
}

export default Disconnected
