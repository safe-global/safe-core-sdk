import { useState, useEffect } from 'react'
import { AuthContext, OrderState, PaymentStandard } from '@monerium/sdk'
import { Box } from '@mui/material'
import Safe from '@safe-global/protocol-kit'

import { useAuth } from '../../AuthContext'
import { MoneriumPack, SafeMoneriumClient } from '@safe-global/onramp-kit'
import Disconnected from './Disconnected'
import DeploySafe from './DeploySafe'
import LoginWithMonerium from './LoginWithMonerium'
import Connected from './Connected'

function Monerium() {
  const [authContext, setAuthContext] = useState<AuthContext>()
  const [safeThreshold, setSafeThreshold] = useState<string>()
  const [moneriumClient, setMoneriumClient] = useState<SafeMoneriumClient>()
  const [moneriumPack, setMoneriumPack] = useState<MoneriumPack>()
  const [orderState, setOrderState] = useState<OrderState>()
  const { isLoggedIn, selectedSafe, provider: authProvider } = useAuth()

  useEffect(() => {
    ;(async () => {
      if (!authProvider || !selectedSafe) return

      const protocolKit = await Safe.init({
        provider: authProvider,
        safeAddress: selectedSafe,
        isL1SafeSingleton: true
      })

      const pack = new MoneriumPack({
        clientId: import.meta.env.VITE_MONERIUM_CLIENT_ID,
        redirectUrl: 'http://localhost:3000/monerium',
        environment: 'sandbox'
      })

      await pack.init({
        protocolKit
      })

      pack.subscribe(OrderState.pending, (notification) => {
        setOrderState(notification.meta.state)
      })

      pack.subscribe(OrderState.placed, (notification) => {
        setOrderState(notification.meta.state)
      })

      pack.subscribe(OrderState.rejected, (notification) => {
        setOrderState(notification.meta.state)
        setTimeout(() => {
          setOrderState(undefined)
        }, 5000)
      })

      pack.subscribe(OrderState.processed, (notification) => {
        setOrderState(notification.meta.state)
        setTimeout(() => {
          setOrderState(undefined)
        }, 5000)
      })

      const threshold = await protocolKit.getThreshold()
      const owners = await protocolKit.getOwners()

      setSafeThreshold(`${threshold}/${owners.length}`)
      setMoneriumPack(pack)
    })()
  }, [authProvider, selectedSafe])

  useEffect(() => {
    startMoneriumFlow()
  }, [moneriumPack])

  const startMoneriumFlow = async (options?: { initiateAuthFlow?: boolean }) => {
    if (!moneriumPack) return

    if (options?.initiateAuthFlow) {
      await moneriumPack.open({ initiateAuthFlow: true })
    } else {
      const moneriumClient = await moneriumPack.open()

      const authContext = await moneriumClient.getAuthContext()
      const profile = await moneriumClient.getProfile(authContext.defaultProfile)
      const balances = await moneriumClient.getBalances()
      const orders = await moneriumClient.getOrders()

      console.group('Monerium data')
      console.log('AuthContext', authContext)
      console.log('Profile', profile)
      console.log('Balances', balances)
      console.log('Orders', orders)
      console.log('Bearer Profile', moneriumClient.bearerProfile)
      console.groupEnd()

      setMoneriumClient(moneriumClient)
      setAuthContext(authContext)
    }
  }

  const closeMoneriumFlow = async () => {
    moneriumPack?.close()
    setAuthContext(undefined)
  }

  const transfer = async (iban: string, amount: string) => {
    const tx = await moneriumClient?.send({
      amount,
      counterpart: {
        identifier: {
          standard: 'iban' as PaymentStandard.iban,
          iban
        },
        details: {
          firstName: 'John',
          lastName: 'Doe',
          country: 'ES'
        }
      },
      memo: 'Testing Safe-Monerium integration'
    })

    console.log('New proposed transaction', tx)
  }

  if (!isLoggedIn) return <Disconnected />

  return (
    <Box p={2}>
      {authContext ? (
        <Connected
          safe={selectedSafe}
          orderState={orderState}
          authContext={authContext}
          onTransfer={transfer}
          onLogout={closeMoneriumFlow}
        />
      ) : (
        <>
          {!selectedSafe && <DeploySafe />}

          {selectedSafe && (
            <LoginWithMonerium
              safe={selectedSafe}
              threshold={safeThreshold || ''}
              onLogin={() => startMoneriumFlow({ initiateAuthFlow: true })}
            />
          )}
        </>
      )}
    </Box>
  )
}

export default Monerium
