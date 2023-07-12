import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { AuthContext, Currency, OrderState, PaymentStandard } from '@monerium/sdk'
import { Box } from '@mui/material'
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'

import { useAuth } from '../../AuthContext'
import { MoneriumPack, SafeMoneriumClient } from '../../../../../src'
import Disconnected from './Disconnected'
import DeploySafe from './DeploySafe'
import LoginWithMonerium from './LoginWithMonerium'
import Connected from './Connected'

const MONERIUM_TOKEN = 'monerium_token'

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

      const provider = new ethers.providers.Web3Provider(authProvider)

      const safeOwner = provider.getSigner()
      const ethAdapter = new EthersAdapter({ ethers, signerOrProvider: safeOwner })

      const safeSdk = await Safe.create({
        ethAdapter: ethAdapter,
        safeAddress: selectedSafe,
        isL1SafeMasterCopy: true
      })

      const pack = new MoneriumPack({
        clientId: import.meta.env.VITE_MONERIUM_CLIENT_ID,
        environment: 'sandbox'
      })

      await pack.init({
        safeSdk
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

      const threshold = await safeSdk.getThreshold()
      const owners = await safeSdk.getOwners()

      setSafeThreshold(`${threshold}/${owners.length}`)
      setMoneriumPack(pack)
    })()
  }, [authProvider, selectedSafe])

  useEffect(() => {
    const authCode = new URLSearchParams(window.location.search).get('code') || undefined
    const refreshToken = localStorage.getItem(MONERIUM_TOKEN) || undefined

    if (authCode || refreshToken) startMoneriumFlow(authCode, refreshToken)
  }, [moneriumPack])

  const startMoneriumFlow = async (authCode?: string, refreshToken?: string) => {
    if (!moneriumPack) return

    const moneriumClient = await moneriumPack.open({
      redirectUrl: 'http://localhost:3000/monerium',
      authCode,
      refreshToken
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
    console.log('Bearer Profile', moneriumClient.bearerProfile)
    console.groupEnd()

    if (moneriumClient.bearerProfile) {
      localStorage.setItem(MONERIUM_TOKEN, moneriumClient.bearerProfile.refresh_token)
    }

    setMoneriumClient(moneriumClient)
    setAuthContext(authContext)
  }

  const closeMoneriumFlow = async () => {
    moneriumPack?.close()
    localStorage.removeItem(MONERIUM_TOKEN)
    setAuthContext(undefined)
  }

  const transfer = async (iban: string, amount: string) => {
    const tx = await moneriumClient?.send({
      amount,
      currency: Currency.eur,
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
              onLogin={() => startMoneriumFlow()}
            />
          )}
        </>
      )}
    </Box>
  )
}

export default Monerium
