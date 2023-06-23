import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { SafeEventEmitterProvider, UserInfo } from '@web3auth/base'
import { Box, Divider, Grid, Typography, Button } from '@mui/material'
import { EthHashInfo } from '@safe-global/safe-react-components'
import Login from '../Login'
import { AuthKitSignInData, MagicConnectPack } from '../../../src/index'

function MagicConnect() {
  const [magicConnectPack, setMagicConnectPack] = useState<MagicConnectPack>()
  const [safeAuthSignInResponse, setSafeAuthSignInResponse] = useState<AuthKitSignInData | null>(
    null
  )
  const [userInfo, setUserInfo] = useState<Partial<UserInfo>>()
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(null)

  useEffect(() => {
    ;(async () => {
      const magicConnectPack = new MagicConnectPack({
        txServiceUrl: 'https://safe-transaction-goerli.safe.global'
      })

      await magicConnectPack.init({
        apiKey: import.meta.env.VITE_MAGIC_API_KEY || '',
        options: { network: 'goerli' }
      })

      setMagicConnectPack(magicConnectPack)
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      if (magicConnectPack?.magicSdk?.user.isLoggedIn()) {
        await login()
      }
    })()
  }, [magicConnectPack?.magicSdk])

  const login = async () => {
    if (!magicConnectPack) return

    const signInInfo = await magicConnectPack.signIn()
    console.log('SIGN IN RESPONSE: ', signInInfo)

    const userInfo = await magicConnectPack.getUserInfo()
    console.log('USER INFO: ', userInfo)

    setSafeAuthSignInResponse(signInInfo)
    setUserInfo(userInfo || undefined)
    setProvider(magicConnectPack.getProvider() as SafeEventEmitterProvider)
  }

  const logout = async () => {
    if (!magicConnectPack) return

    await magicConnectPack.signOut()

    setProvider(null)
    setSafeAuthSignInResponse(null)
  }

  const sendTransaction = async () => {
    if (!magicConnectPack) return

    const provider = new ethers.providers.Web3Provider(
      magicConnectPack.getProvider() as ethers.providers.ExternalProvider
    )

    const signer = provider.getSigner()

    const destination = signer.getAddress()

    await signer.sendTransaction({
      to: destination,
      value: 0
    })
  }

  return (
    <Box p={4}>
      <Typography variant="h3" color="secondary" fontWeight={700}>
        Magic Connect
      </Typography>
      <Divider sx={{ my: 3 }} />
      <Login onLogin={login} onLogout={logout} userInfo={userInfo} isLoggedIn={!!provider} />
      {safeAuthSignInResponse?.eoa && (
        <>
          <Grid container>
            <Grid item md={4} mt={4}>
              <Typography variant="h3" color="secondary" fontWeight={700}>
                Owner account
              </Typography>
              <Divider sx={{ my: 3 }} />
              <EthHashInfo
                address={safeAuthSignInResponse.eoa}
                showCopyButton
                showPrefix
                prefix={getPrefix('0x5')}
              />
            </Grid>
            <Grid item md={8} mt={4} pl={4}>
              <>
                <Typography variant="h3" color="secondary" fontWeight={700}>
                  Available Safes
                </Typography>
                <Divider sx={{ my: 3 }} />
                {safeAuthSignInResponse?.safes?.length ? (
                  safeAuthSignInResponse?.safes?.map((safe, index) => (
                    <Box sx={{ my: 3 }} key={index}>
                      <EthHashInfo address={safe} showCopyButton shortAddress={false} />
                    </Box>
                  ))
                ) : (
                  <Box display="inline-flex" alignItems="center">
                    <Typography variant="body1" color="secondary" fontWeight={700}>
                      No Available Safes
                    </Typography>
                    <Button
                      color="primary"
                      variant="text"
                      href="https://app.safe.global/new-safe/create"
                      target="_blank"
                      sx={{
                        ml: 2
                      }}
                    >
                      Deploy new Safe
                    </Button>
                  </Box>
                )}
              </>
            </Grid>
          </Grid>
          <Button variant="contained" onClick={sendTransaction} sx={{ mt: 4 }}>
            Send dummy transaction
          </Button>
        </>
      )}
    </Box>
  )
}

const getPrefix = (chainId: string) => {
  switch (chainId) {
    case '0x1':
    case '0x5':
      return 'gor'
    case '0x100':
      return 'gno'
    case '0x137':
      return 'matic'
    default:
      return 'eth'
  }
}

export default MagicConnect
