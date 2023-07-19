import React, { createContext, useState, useEffect } from 'react'
import { Web3AuthOptions } from '@web3auth/modal'
import { CHAIN_NAMESPACES, SafeEventEmitterProvider, WALLET_ADAPTERS } from '@web3auth/base'
import { OpenloginAdapter } from '@web3auth/openlogin-adapter'
import { Web3AuthModalPack, AuthKitSignInData } from '@safe-global/auth-kit'

type AuthContextProviderProps = {
  children: React.ReactNode
}

type AuthContextType = {
  isLoggedIn: boolean
  provider?: SafeEventEmitterProvider
  data?: AuthKitSignInData
  selectedSafe: string
  setSelectedSafe?: (safe: string) => void
  logIn?: () => void
  logOut?: () => void
}

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  selectedSafe: ''
})

const AuthProvider = ({ children }: AuthContextProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [web3AuthPack, setWeb3AuthPack] = useState<Web3AuthModalPack>()
  const [safeAuthSignInResponse, setSafeAuthSignInResponse] = useState<AuthKitSignInData>()
  const [provider, setProvider] = useState<SafeEventEmitterProvider | undefined>()
  const [selectedSafe, setSelectedSafe] = useState('')

  useEffect(() => {
    ;(async () => {
      const options: Web3AuthOptions = {
        clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID || '',
        web3AuthNetwork: 'testnet',
        chainConfig: {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: '0x5',
          rpcTarget: 'https://rpc.ankr.com/eth_goerli'
        },
        uiConfig: {
          theme: 'dark',
          loginMethodsOrder: ['google', 'facebook']
        }
      }

      const modalConfig = {
        [WALLET_ADAPTERS.TORUS_EVM]: {
          label: 'torus',
          showOnModal: false
        },
        [WALLET_ADAPTERS.METAMASK]: {
          label: 'metamask',
          showOnDesktop: true,
          showOnMobile: false
        }
      }

      const openloginAdapter = new OpenloginAdapter({
        loginSettings: {
          mfaLevel: 'mandatory'
        },
        adapterSettings: {
          uxMode: 'popup',
          whiteLabel: {
            name: 'Safe'
          }
        }
      })

      const web3AuthPack = new Web3AuthModalPack({
        txServiceUrl: 'https://safe-transaction-goerli.safe.global'
      })

      await web3AuthPack.init({ options, adapters: [openloginAdapter], modalConfig })

      const provider = web3AuthPack.getProvider()

      if (provider) {
        const response = await web3AuthPack.signIn()
        setSafeAuthSignInResponse(response)
        setSelectedSafe(response?.safes?.[0] || '')
        setProvider(provider as SafeEventEmitterProvider)

        setIsLoggedIn(true)
      }

      setWeb3AuthPack(web3AuthPack)
    })()
  }, [])

  const logIn = async () => {
    if (!web3AuthPack) return

    const response = await web3AuthPack.signIn()
    console.log('SIGN IN RESPONSE: ', response)

    setSafeAuthSignInResponse(response)
    setSelectedSafe(response?.safes?.[0] || '')
    setProvider(web3AuthPack.getProvider() as SafeEventEmitterProvider)
    setIsLoggedIn(true)
  }

  const logOut = async () => {
    if (!web3AuthPack) return

    await web3AuthPack.signOut()

    setProvider(undefined)
    setSafeAuthSignInResponse(undefined)
    setIsLoggedIn(false)
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        provider,
        data: safeAuthSignInResponse,
        logIn,
        logOut,
        selectedSafe,
        setSelectedSafe
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

const useAuth = () => {
  const context = React.useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthContextProvider')
  }

  return context
}

export { AuthProvider, useAuth }
