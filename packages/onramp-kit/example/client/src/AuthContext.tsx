import React, { createContext, useState, useEffect } from 'react'
import { Web3AuthOptions } from '@web3auth/modal'
import { CHAIN_NAMESPACES, SafeEventEmitterProvider, WALLET_ADAPTERS } from '@web3auth/base'
import { OpenloginAdapter } from '@web3auth/openlogin-adapter'
import { SafeAuthKit, Web3AuthAdapter, SafeAuthSignInData } from '../../../../auth-kit/src/index'

type AuthContextProviderProps = {
  children: React.ReactNode
}

interface AuthContextType {
  isLoggedIn: boolean
  provider?: SafeEventEmitterProvider
  data?: SafeAuthSignInData
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
  const [safeAuth, setSafeAuth] = useState<SafeAuthKit<Web3AuthAdapter>>()
  const [safeAuthSignInResponse, setSafeAuthSignInResponse] = useState<SafeAuthSignInData>()
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
          rpcTarget: `https://goerli.infura.io/v3/${import.meta.env.VITE_INFURA_KEY}`
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

      const adapter = new Web3AuthAdapter(options, [openloginAdapter], modalConfig)

      const safeAuthKit = await SafeAuthKit.init(adapter, {
        txServiceUrl: 'https://safe-transaction-goerli.safe.global'
      })

      const provider = safeAuthKit.getProvider()

      if (provider) {
        const response = await safeAuthKit.signIn()
        setSafeAuthSignInResponse(response)
        setSelectedSafe(response?.safes?.[0] || '')
        setProvider(provider as SafeEventEmitterProvider)

        setIsLoggedIn(true)
      }

      setSafeAuth(safeAuthKit)
    })()
  }, [])

  const logIn = async () => {
    if (!safeAuth) return

    const response = await safeAuth.signIn()
    console.log('SIGN IN RESPONSE: ', response)

    setSafeAuthSignInResponse(response)
    setSelectedSafe(response?.safes?.[0] || '')
    setProvider(safeAuth.getProvider() as SafeEventEmitterProvider)

    setIsLoggedIn(true)
  }

  const logOut = async () => {
    if (!safeAuth) return

    await safeAuth.signOut()

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