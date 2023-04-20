import { useState, useEffect, useMemo } from 'react'
import { ethers } from 'ethers'
import { AuthContext, Currency, PaymentStandard } from '@monerium/sdk'
import { Alert, Box, Button, TextField, Typography } from '@mui/material'
import { SafeOnRampKit, MoneriumAdapter, SafeMoneriumClient } from '../../../../src'
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import { useAuth } from '../AuthContext'

function Monerium() {
  const [authContext, setAuthContext] = useState<AuthContext>()
  const [safeThreshold, setSafeThreshold] = useState<string>()
  const [counterpartIban, setCounterpartIban] = useState<string>('')
  const [moneriumClient, setMoneriumClient] = useState<SafeMoneriumClient>()
  const [onRampClient, setOnRampClient] = useState<SafeOnRampKit<MoneriumAdapter>>()
  const { isLoggedIn, selectedSafe, provider: authProvider } = useAuth()

  useEffect(() => {
    ;(async () => {
      if (!authProvider || !selectedSafe) return

      const provider = new ethers.providers.Web3Provider(authProvider)

      const safeOwner = provider.getSigner()
      const ethAdapter = new EthersAdapter({ ethers, signerOrProvider: safeOwner })

      const safeSdk = await Safe.create({
        ethAdapter: ethAdapter,
        safeAddress: selectedSafe,
        isL1SafeMasterCopy: true
      })

      const client = await SafeOnRampKit.init(
        new MoneriumAdapter({
          clientId: import.meta.env.VITE_MONERIUM_CLIENT_ID,
          environment: 'sandbox'
        }),
        safeSdk
      )

      const threshold = await safeSdk.getThreshold()
      const owners = await safeSdk.getOwners()

      setSafeThreshold(`${threshold}/${owners.length}`)
      setOnRampClient(client)
    })()
  }, [authProvider, selectedSafe])

  useEffect(() => {
    const codeParam = new URLSearchParams(window.location.search).get('code')
    const refreshToken = localStorage.getItem('monerium_refresh_token')

    if (codeParam || refreshToken) startMoneriumFlow()
  }, [onRampClient])

  const startMoneriumFlow = async () => {
    if (!onRampClient) return

    const moneriumClient = await onRampClient.open({
      redirect_uri: 'http://localhost:3000/monerium',
      address: selectedSafe
    })

    const authContext = await moneriumClient.getAuthContext()
    const profile = await moneriumClient.getProfile(authContext.defaultProfile)
    const balances = await moneriumClient.getBalances()
    const orders = await moneriumClient.getOrders()

    console.group('Monerium data')
    console.log('AuthContext', authContext)
    console.log('Profile', profile)
    console.log('Balances', balances)
    console.log('Orders', orders)
    console.groupEnd()

    setMoneriumClient(moneriumClient)
    setAuthContext(authContext)
  }

  const closeMoneriumFlow = async () => {
    onRampClient?.close()
    setAuthContext(undefined)
  }

  const transfer = async () => {
    moneriumClient?.send({
      safeAddress: selectedSafe,
      amount: '1',
      currency: Currency.eur,
      counterpart: {
        identifier: {
          standard: 'iban' as PaymentStandard.iban,
          iban: counterpartIban
        },
        details: {
          firstName: 'John',
          lastName: 'Doe',
          country: 'ES'
        }
      },
      memo: 'Testing Safe-Monerium integration'
    })
  }

  if (!isLoggedIn)
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
          Once you connect you will see the owner and the associated Safes. Choose the one you want
          to link to Monerium
        </Typography>
      </Box>
    )

  return (
    <Box p={2}>
      {authContext ? (
        <>
          <p>Email: {authContext.email}</p>
          <p>User Id: {authContext.userId}</p>
          <p>Default profile: {authContext.defaultProfile}</p>

          <TextField
            value={counterpartIban}
            onChange={(e) => setCounterpartIban(e.target.value)}
            placeholder="Enter the recipient's IBAN"
            sx={{ mb: 2, width: '24em' }}
          />

          <br />

          {counterpartIban && selectedSafe && (
            <>
              <Alert severity="info">{`You are going to transfer 1 EUR from ${selectedSafe} to ${counterpartIban}`}</Alert>

              <Button variant="contained" onClick={transfer} sx={{ my: 2, mr: 2 }}>
                Transfer
              </Button>
            </>
          )}

          <Button variant="contained" color="error" onClick={closeMoneriumFlow}>
            Logout from Monerium
          </Button>
        </>
      ) : (
        <>
          {!selectedSafe && (
            <>
              <Typography variant="h5" color="primary">
                No Safes found
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                You need to connect with an owner with at least one Safe. Click the deploy Safe
                button and then reload.
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
          )}

          {selectedSafe && (
            <>
              <Typography variant="h5" color="primary">
                Connected !!
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                You are connected and have selected the following Safe:{' '}
                <Typography color="primary" component="span">
                  {selectedSafe} ({safeThreshold})
                </Typography>
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                You now can login with Monerium and link the selected Safe with your account
              </Typography>
              <br />
              <Button variant="contained" onClick={startMoneriumFlow}>
                Login with Monerium
              </Button>
            </>
          )}
        </>
      )}
    </Box>
  )
}

export default Monerium
