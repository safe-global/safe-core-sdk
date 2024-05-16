import React, { createContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { SafeAuthPack, AuthKitSignInData, SafeAuthInitOptions } from '@safe-global/auth-kit'

type AuthContextProviderProps = {
  children: React.ReactNode
}

type AuthContextType = {
  isLoggedIn: boolean
  provider: ethers.Eip1193Provider | null
  data?: AuthKitSignInData
  selectedSafe: string
  setSelectedSafe?: (safe: string) => void
  logIn?: () => void
  logOut?: () => void
}

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  selectedSafe: '',
  provider: null
})
const STORED_SAFE = 'selected_safe'
const AuthProvider = ({ children }: AuthContextProviderProps) => {
  const [safeAuthPack, setSafeAuthPack] = useState<SafeAuthPack>()
  const [isAuthenticated, setIsAuthenticated] = useState(!!safeAuthPack?.isAuthenticated)
  const [safeAuthSignInResponse, setSafeAuthSignInResponse] = useState<AuthKitSignInData>()
  const [provider, setProvider] = useState<ethers.Eip1193Provider | null>()
  const [selectedSafe, setSelectedSafe] = useState('')

  const storedSafe = sessionStorage.getItem(STORED_SAFE)

  useEffect(() => {
    ;(async () => {
      const authPack = new SafeAuthPack()

      const options: SafeAuthInitOptions = {
        enableLogging: true,
        showWidgetButton: false,
        chainConfig: { chainId: '0xaa36a7', rpcTarget: 'https://sepolia.gateway.tenderly.co' }
      }

      await authPack.init(options)

      setSafeAuthPack(authPack)

      // If the provider has an account the we can try to sign in the user
      authPack.subscribe('accountsChanged', async (accounts: string[]) => {
        if (accounts.length > 0) {
          const signInInfo = await authPack?.signIn()

          setSafeAuthSignInResponse(signInInfo)
          setIsAuthenticated(true)

          if (signInInfo.safes && signInInfo.safes.length > 0) {
            setSelectedSafe(storedSafe || signInInfo?.safes[0])
          }
        }
      })
    })()
  }, [])

  useEffect(() => {
    if (!safeAuthPack || !isAuthenticated) return

    setProvider(safeAuthPack.getProvider())
  }, [isAuthenticated])

  const logIn = async () => {
    if (!safeAuthPack) return

    const signInInfo = await safeAuthPack.signIn()
    setSafeAuthSignInResponse(signInInfo)
    setIsAuthenticated(true)

    if (signInInfo?.safes && signInInfo.safes.length > 0) {
      setSelectedSafe(storedSafe || signInInfo?.safes[0])
    }
  }

  const logOut = async () => {
    if (!safeAuthPack) return

    await safeAuthPack.signOut()

    setProvider(undefined)
    setSafeAuthSignInResponse(undefined)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: isAuthenticated,
        provider: provider || null,
        data: safeAuthSignInResponse,
        logIn,
        logOut,
        selectedSafe,
        setSelectedSafe: (safe) => {
          sessionStorage.setItem(STORED_SAFE, safe)
          setSelectedSafe(safe)
        }
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
