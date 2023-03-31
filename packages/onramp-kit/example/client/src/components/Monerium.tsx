import { useState, useEffect } from 'react'
import { AuthContext, Chain, Network } from '@monerium/sdk'
import { Box, Button } from '@mui/material'
import { SafeOnRampKit, MoneriumAdapter } from '../../../../src'

function Monerium() {
  const [authContext, setAuthContext] = useState<AuthContext>()

  const startMoneriumFlow = async () => {
    const onRampClient = await SafeOnRampKit.init(
      new MoneriumAdapter({
        clientId: import.meta.env.VITE_MONERIUM_CLIENT_ID,
        environment: 'sandbox'
      })
    )

    const moneriumClient = await onRampClient.open({
      redirect_uri: 'http://localhost:3000/monerium',
      address: '0xaEA7d6AfE44952fbFD5af0992970Fe8bb1ab7aE5',
      signature: '0x',
      chain: Chain.ethereum,
      network: Network.goerli
    })

    const authContext = await moneriumClient.getAuthContext()
    const balances = await moneriumClient.getBalances()
    const orders = await moneriumClient.getOrders()

    console.log(authContext, balances, orders)

    setAuthContext(authContext)
  }

  return (
    <Box p={2}>
      {authContext ? (
        <>
          <p>{authContext.email}</p>
          <p>{authContext.userId}</p>
          <p>{authContext.name}</p>
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
