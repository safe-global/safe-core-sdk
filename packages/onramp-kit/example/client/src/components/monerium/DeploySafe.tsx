import { Button, Typography } from '@mui/material'

function DeploySafe() {
  return (
    <>
      <Typography variant="h5" color="primary">
        No Safes found
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        You need to connect with an owner with at least one Safe. Click the deploy Safe button and
        then reload.
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        ⚠️ Remember to add the connected address as an owner of the Safe. ⚠️
      </Typography>
      <Button
        color="primary"
        variant="contained"
        href="https://app.safe.global/new-safe/create"
        target="_blank"
        sx={{ mt: 2 }}
      >
        Deploy new Safe
      </Button>
      <Button
        color="primary"
        variant="contained"
        onClick={() => window.location.reload()}
        sx={{ mt: 2, ml: 2 }}
      >
        Reload tab
      </Button>
    </>
  )
}

export default DeploySafe
