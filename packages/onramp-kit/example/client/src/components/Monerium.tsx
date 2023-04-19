import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { AuthContext, Currency, PaymentStandard } from '@monerium/sdk'
import { Alert, Box, Button, TextField } from '@mui/material'
import { SafeOnRampKit, MoneriumAdapter, SafeMoneriumClient } from '../../../../src'
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'

function Monerium() {
  const [authContext, setAuthContext] = useState<AuthContext>()
  const [address, setAddress] = useState<string>('')
  const [counterpartIban, setCounterpartIban] = useState<string>('')
  const [moneriumClient, setMoneriumClient] = useState<SafeMoneriumClient>()
  const [onRampClient, setOnRampClient] = useState<SafeOnRampKit<MoneriumAdapter>>()

  useEffect(() => {
    if (!ethers.utils.isAddress(address)) {
      return
    }

    ;(async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      const safeOwner = provider.getSigner()
      const ethAdapter = new EthersAdapter({ ethers, signerOrProvider: safeOwner })

      const safeSdk = await Safe.create({
        ethAdapter: ethAdapter,
        safeAddress: address,
        isL1SafeMasterCopy: true
      })

      const client = await SafeOnRampKit.init(
        new MoneriumAdapter({
          clientId: import.meta.env.VITE_MONERIUM_CLIENT_ID,
          environment: 'sandbox'
        }),
        safeSdk
      )

      setOnRampClient(client)
    })()
  }, [address])

  useEffect(() => {
    const codeParam = new URLSearchParams(window.location.search).get('code')
    const refreshToken = localStorage.getItem('monerium_refresh_token')

    if (codeParam || refreshToken) startMoneriumFlow()
  }, [onRampClient])

  const startMoneriumFlow = async () => {
    if (!onRampClient) return

    const moneriumClient = await onRampClient.open({
      redirect_uri: 'http://localhost:3000/monerium',
      address
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
      safeAddress: address,
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

  return (
    <Box p={2}>
      {authContext ? (
        <>
          <p>Email: {authContext.email}</p>
          <p>User Id: {authContext.userId}</p>
          <p>Default profile: {authContext.defaultProfile}</p>

          <TextField
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your Safe address"
            sx={{ mb: 2, width: '24em' }}
          />

          <TextField
            value={counterpartIban}
            onChange={(e) => setCounterpartIban(e.target.value)}
            placeholder="Enter the recipient's IBAN"
            sx={{ mb: 2, width: '24em' }}
          />

          <br />

          {counterpartIban && address && (
            <>
              <Alert severity="info">{`You are going to transfer 1 EUR from ${address} to ${counterpartIban}`}</Alert>

              <Button variant="contained" onClick={transfer} sx={{ my: 2, mr: 2 }}>
                Transfer
              </Button>
            </>
          )}

          <Button variant="contained" color="error" onClick={closeMoneriumFlow}>
            Logout
          </Button>
        </>
      ) : (
        <>
          <TextField
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your Safe address"
            sx={{ mb: 2, width: '24em' }}
          />
          <br />
          <Button variant="contained" onClick={startMoneriumFlow}>
            Authenticate with monerium
          </Button>
        </>
      )}
    </Box>
  )
}

export default Monerium
