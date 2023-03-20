import { useEffect, useState, useRef } from 'react'
import { isAddress } from '@ethersproject/address'
import { SafeOnRampKit, StripeSession, StripeAdapter } from '../../../src'
import { Grid, TextField, Button } from '@mui/material'

import AppBar from './AppBar'

const isSessionValid = (sessionId: string) => sessionId.length === 28

function App() {
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [sessionId, setSessionId] = useState<string>('')
  const [onRampClient, setOnRampClient] = useState<SafeOnRampKit<StripeAdapter>>()
  const stripeRootRef = useRef<HTMLDivElement>(null)

  const handleCreateSession = async () => {
    if (!isSessionValid(sessionId) && !isAddress(walletAddress)) return

    if (stripeRootRef.current) {
      stripeRootRef.current.innerHTML = ''
    }

    const sessionData = (await onRampClient?.open({
      element: '#stripe-root',
      sessionId: sessionId,
      theme: 'light',
      defaultOptions: {
        transaction_details: {
          wallet_address: walletAddress,
          supported_destination_networks: ['ethereum', 'polygon'],
          supported_destination_currencies: ['usdc'],
          lock_wallet_address: true
        },
        customer_information: {
          email: 'john@doe.com'
        }
      }
    })) as StripeSession

    onRampClient?.subscribe('onramp_ui_loaded', () => {
      console.log('UI loaded')
    })

    onRampClient?.subscribe('onramp_session_updated', (e) => {
      console.log('Session Updated', e.payload)
    })

    setWalletAddress(sessionData?.transaction_details?.wallet_address || '')
  }

  useEffect(() => {
    ;(async () => {
      const onRampClient = await SafeOnRampKit.init(
        new StripeAdapter({
          stripePublicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
          onRampBackendUrl: import.meta.env.VITE_SAFE_STRIPE_BACKEND_BASE_URL
        })
      )

      setOnRampClient(onRampClient)
    })()
  }, [])

  return (
    <>
      <AppBar />
      <Grid container p={2} height="90vh">
        <Grid item sm={12} md={4} p={2} sx={{ borderRight: `1px solid #303030` }}>
          <TextField
            id="wallet-address"
            label="Wallet address"
            placeholder="Enter the address you want to initialize the session with"
            variant="outlined"
            value={walletAddress}
            onChange={(event) => setWalletAddress(event.target.value)}
            sx={{ width: '100%' }}
          />
          <TextField
            id="session-id"
            label="Session id"
            placeholder="Enter the session id if you have one"
            variant="outlined"
            value={sessionId}
            onChange={(event) => setSessionId(event.target.value)}
            sx={{ width: '100%', mt: 2 }}
          />
          <br />
          <Button variant="contained" onClick={handleCreateSession} sx={{ mt: 3 }}>
            Create session
          </Button>
        </Grid>
        <Grid item sm={12} md={8} p={2}>
          <div id="stripe-root" ref={stripeRootRef}></div>
        </Grid>
      </Grid>
    </>
  )
}

export default App
