import { Button, Typography } from '@mui/material'

type LoginWithMoneriumProps = {
  safe: string
  threshold: string
  onLogin: () => void
}

function LoginWithMonerium({ safe, threshold, onLogin }: LoginWithMoneriumProps) {
  return (
    <>
      <Typography variant="h5" color="primary">
        Connected !!
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        You are connected and have selected the following Safe:{' '}
        <Typography color="primary" component="span">
          {safe} ({threshold})
        </Typography>
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        You now can login with Monerium and link the selected Safe with your account
      </Typography>
      <br />
      <Button variant="contained" onClick={onLogin}>
        Login with Monerium
      </Button>
    </>
  )
}

export default LoginWithMonerium
