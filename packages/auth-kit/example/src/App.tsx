import { useEffect, useState } from 'react'
import { Box, Divider, Grid, Typography } from '@mui/material'
import { EthHashInfo } from '@safe-global/safe-react-components'
import { TorusParams, UserInfo } from '@web3auth/ws-embed'

import AppBar from './AppBar'
import { AuthKitSignInData, Web3AuthModalPack } from '../../src/index'
import { SafeEventEmitterProvider } from '@web3auth/base'

function App() {
  const [web3AuthModalPack, setWeb3AuthModalPack] = useState<Web3AuthModalPack>()
  const [safeAuthSignInResponse, setSafeAuthSignInResponse] = useState<AuthKitSignInData | null>(
    null
  )
  const [userInfo, setUserInfo] = useState<Partial<UserInfo>>()
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(null)

  useEffect(() => {
    ;(async () => {
      const options: TorusParams = {
        chainConfig: {
          logo: 'https://raw.githubusercontent.com/torusresearch/torus-assets/master/torus.png',
          displayName: 'Ethereum Mainnet',
          blockExplorerUrl: 'https://etherscan.io',
          chainId: '0x1',
          rpcTarget: `https://mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_KEY}`,
          ticker: 'ETH',
          tickerName: 'Ether'
        }
      }

      const web3AuthModalPack = new Web3AuthModalPack({
        txServiceUrl: 'https://safe-transaction-mainnet.safe.global'
      })

      await web3AuthModalPack.init(options)

      setWeb3AuthModalPack(web3AuthModalPack)
    })()
  }, [])

  // useEffect(() => {
  //   if (web3AuthModalPack && web3AuthModalPack.getProvider()) {
  //     ;(async () => {
  //       await login()
  //     })()
  //   }
  // }, [web3AuthModalPack])

  const login = async () => {
    if (!web3AuthModalPack) return

    const signInInfo = await web3AuthModalPack.signIn()
    console.log('SIGN IN RESPONSE: ', signInInfo)

    // const userInfo = await web3AuthModalPack.getUserInfo()
    // console.log('USER INFO: ', userInfo)

    // setSafeAuthSignInResponse(signInInfo)
    // setUserInfo(userInfo || undefined)
    // setProvider(web3AuthModalPack.getProvider() as SafeEventEmitterProvider)
  }

  const logout = async () => {
    if (!web3AuthModalPack) return

    await web3AuthModalPack.signOut()

    setProvider(null)
    setSafeAuthSignInResponse(null)
  }

  return (
    <>
      <AppBar onLogin={login} onLogout={logout} userInfo={userInfo} isLoggedIn={!!provider} />
      {safeAuthSignInResponse?.eoa && (
        <Grid container>
          <Grid item md={4} p={4}>
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
          <Grid item md={8} p={4}>
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
                <Typography variant="body1" color="secondary" fontWeight={700}>
                  No Available Safes
                </Typography>
              )}
            </>
          </Grid>
        </Grid>
      )}
    </>
  )
}

export default App
