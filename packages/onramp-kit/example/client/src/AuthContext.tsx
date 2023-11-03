import React, { createContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { SUPPORTED_NETWORKS } from '@toruslabs/ethereum-controllers'
import { SafeAuthPack, AuthKitSignInData } from '@safe-global/auth-kit'

type AuthContextProviderProps = {
  children: React.ReactNode
}

type AuthContextType = {
  isLoggedIn: boolean
  provider?: ethers.providers.ExternalProvider
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
  const [safeAuthPack, setSafeAuthPack] = useState<SafeAuthPack>()
  const [safeAuthSignInResponse, setSafeAuthSignInResponse] = useState<AuthKitSignInData>()
  const [provider, setProvider] = useState<ethers.providers.ExternalProvider | undefined>()
  const [selectedSafe, setSelectedSafe] = useState('')

  useEffect(() => {
    ;(async () => {
      const safeAuthPack = new SafeAuthPack({
        txServiceUrl: 'https://safe-transaction-goerli.safe.global'
      })

      const options: SafeAuthInitOptions = {
        enableLogging: true,
        showWidgetButton: false,
        chainConfig: SUPPORTED_NETWORKS['0x64']
      }

      await safeAuthPack.init(options)

      const provider = safeAuthPack.getProvider()

      if (provider) {
        const response = await safeAuthPack.signIn()
        setSafeAuthSignInResponse(response)
        setSelectedSafe(response?.safes?.[0] || '')
        setProvider(provider as ethers.providers.ExternalProvider)

        setIsLoggedIn(true)
      }

      setSafeAuthPack(safeAuthPack)
    })()
  }, [])

  const logIn = async () => {
    if (!safeAuthPack) return

    const response = await safeAuthPack.signIn()
    console.log('SIGN IN RESPONSE: ', response)

    setSafeAuthSignInResponse(response)
    setSelectedSafe(response?.safes?.[0] || '')
    setProvider(safeAuthPack.getProvider() as ethers.providers.ExternalProvider)
    setIsLoggedIn(true)
  }

  const logOut = async () => {
    if (!safeAuthPack) return

    await safeAuthPack.signOut()

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
