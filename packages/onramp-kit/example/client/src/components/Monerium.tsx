import { useState, useEffect } from 'react'
import {
  AuthContext,
  Chain,
  Currency,
  MoneriumClient,
  Network,
  OrderKind,
  PaymentStandard
} from '@monerium/sdk'
import { Box, Button } from '@mui/material'
import { SafeOnRampKit, MoneriumAdapter } from '../../../../src'

function Monerium() {
  const [authContext, setAuthContext] = useState<AuthContext>()
  const [moneriumClient, setMoneriumClient] = useState<MoneriumClient>()
  const [onRampClient, setOnRampClient] = useState<SafeOnRampKit<MoneriumAdapter>>()

  useEffect(() => {
    ;(async () => {
      const client = await SafeOnRampKit.init(
        new MoneriumAdapter({
          clientId: import.meta.env.VITE_MONERIUM_CLIENT_ID,
          environment: 'sandbox'
        })
      )

      setOnRampClient(client)
    })()
  }, [])

  useEffect(() => {
    const codeParam = new URLSearchParams(window.location.search).get('code')
    const refreshToken = localStorage.getItem('monerium_refresh_token')

    if (codeParam || refreshToken) startMoneriumFlow()
  }, [onRampClient])

  const startMoneriumFlow = async () => {
    if (!onRampClient) return

    const moneriumClient = await onRampClient.open({
      redirect_uri: 'http://localhost:3000/monerium'
      // address: '0x5f0155fA3eFe175Aa7e18EC19Fd8aC1C1Fa7104D',
      // signature: '0x',
      // chain: Chain.ethereum,
      // network: Network.goerli
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

  const placeOrder = async () => {
    const date = new Date().toISOString()

    const newOrder = {
      kind: OrderKind.redeem,
      amount: '1',
      signature: '0x',
      accountId: '053b82db-d871-11ed-8347-d21c9f8d80e1',
      address: '0x1D762aB2D95F133c28e824cbBE90594c87A260Cb',
      currency: Currency.eur,
      counterpart: {
        identifier: {
          standard: PaymentStandard.iban as PaymentStandard.iban,
          iban: 'GR16 0110 1250 0000 0001 2300 695'
        },
        details: {
          firstName: 'John',
          lastName: 'Doe',
          country: 'ES'
        }
      },
      memo: 'Testing Safe-Monerium integration',
      message: `Send EUR 1 to GR16 0110 1250 0000 0001 2300 695 at ${date}`,
      chain: Chain.ethereum,
      network: Network.goerli,
      supportingDocumentId: ''
    }

    const order = await moneriumClient?.placeOrder(newOrder, authContext?.defaultProfile)

    console.log('New Order generated: ', order)
  }

  return (
    <Box p={2}>
      {authContext ? (
        <>
          <p>Email: {authContext.email}</p>
          <p>User Id: {authContext.userId}</p>
          <p>Name: {authContext.name}</p>
          <p>Profile: {authContext.defaultProfile}</p>

          <Button variant="contained" onClick={placeOrder}>
            Place order
          </Button>

          <Button variant="contained" color="error" onClick={closeMoneriumFlow}>
            Logout
          </Button>
        </>
      ) : (
        <Button variant="contained" onClick={startMoneriumFlow}>
          Authenticate
        </Button>
      )}
    </Box>
  )
}

export default Monerium
