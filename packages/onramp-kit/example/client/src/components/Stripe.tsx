import { useEffect, useState, useRef } from 'react'
import { ethers } from 'ethers'
import { Grid, TextField, Button } from '@mui/material'

import { StripeSession, StripePack } from '../../../../src'

const isSessionValid = (sessionId: string) => sessionId.length === 28

function Stripe() {
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [sessionId, setSessionId] = useState<string>('')
  const [stripePack, setStripePack] = useState<StripePack>()
  const stripeRootRef = useRef<HTMLDivElement>(null)

  const handleCreateSession = async () => {
    if (!isSessionValid(sessionId) && !ethers.utils.isAddress(walletAddress)) return

    if (stripeRootRef.current) {
      stripeRootRef.current.innerHTML = ''
    }

    const sessionData = (await stripePack?.open({
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

    stripePack?.subscribe('onramp_ui_loaded', () => {
      console.log('UI loaded')
    })

    stripePack?.subscribe('onramp_session_updated', (e) => {
      console.log('Session Updated', e.payload)
    })

    setWalletAddress(sessionData?.transaction_details?.wallet_address || '')
  }

  useEffect(() => {
    ;(async () => {
      const pack = new StripePack({
        stripePublicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
        onRampBackendUrl: import.meta.env.VITE_SAFE_STRIPE_BACKEND_BASE_URL
      })

      await pack.init()

      setStripePack(pack)
    })()
  }, [])

  return (
    <Grid container height="80vh">
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
  )
}

export default Stripe
