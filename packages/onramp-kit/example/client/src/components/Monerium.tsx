import { useState, useEffect } from 'react'
import { AuthContext, Chain, Network } from '@monerium/sdk'
import { Box } from '@mui/material'
import { SafeOnRampKit, MoneriumAdapter } from '../../../../src'

function Monerium() {
  const [authContext, setAuthContext] = useState<AuthContext>()

  useEffect(() => {
    ;(async () => {
      const onRampClient = await SafeOnRampKit.init(
        new MoneriumAdapter({
          clientId: import.meta.env.VITE_MONERIUM_CLIENT_ID,
          environment: 'sandbox'
        })
      )

      const moneriumClient = await onRampClient.open({
        redirect_uri: 'http://localhost:3000/monerium',
        address: '0xCbe2bae8AE3a356f5688147f1183CB33747FA715',
        signature: '0x',
        chain: Chain.ethereum,
        network: Network.goerli
      })

      const authContext = await moneriumClient.getAuthContext()
      console.log(authContext)

      setAuthContext(authContext)
    })()
  }, [])

  return (
    <Box p={2}>
      {authContext ? (
        <>
          <p>{authContext.email}</p>
          <p>{authContext.userId}</p>
          <p>{authContext.name}</p>
        </>
      ) : (
        <h2>Monerium integration test</h2>
      )}
    </Box>
  )
}

export default Monerium
