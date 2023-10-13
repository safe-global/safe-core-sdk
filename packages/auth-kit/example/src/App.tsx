import { useEffect, useState } from 'react'
import { Box, Button, Divider, Grid, Typography } from '@mui/material'
import { EthHashInfo } from '@safe-global/safe-react-components'
import { TorusParams, UserInfo } from '@web3auth/ws-embed'

import AppBar from './AppBar'
import { AuthKitSignInData, Web3AuthModalPack } from '../../src/index'
import { ethers } from 'ethers'

function App() {
  const [web3AuthModalPack, setWeb3AuthModalPack] = useState<Web3AuthModalPack>()
  const [safeAuthSignInResponse, setSafeAuthSignInResponse] = useState<AuthKitSignInData | null>(
    null
  )
  const [userInfo, setUserInfo] = useState<Partial<UserInfo>>()
  const [chainId, setChainId] = useState<string>()
  const [balance, setBalance] = useState<string>()

  const [provider, setProvider] = useState<ethers.providers.Web3Provider>()

  useEffect(() => {
    ;(async () => {
      const options: TorusParams = {
        enableLogging: true,
        showWidgetButton: false,
        chainConfig: {
          logo: 'https://raw.githubusercontent.com/torusresearch/torus-assets/master/torus.png',
          displayName: 'Ethereum Goerli',
          blockExplorerUrl: 'https://goerli.etherscan.io',
          chainId: '0x5',
          rpcTarget: 'https://ethereum-goerli.publicnode.com',
          ticker: 'ETH',
          tickerName: 'Ether',
          isTestnet: true
        }
      }

      const web3AuthModalPack = new Web3AuthModalPack({
        txServiceUrl: 'https://safe-transaction-goerli.safe.global'
      })

      await web3AuthModalPack.init(options)

      setWeb3AuthModalPack(web3AuthModalPack)
    })()
  }, [])

  const login = async () => {
    if (!web3AuthModalPack) return

    const signInInfo = await web3AuthModalPack.signIn()
    console.log('SIGN IN RESPONSE: ', signInInfo)

    const userInfo = await web3AuthModalPack.getUserInfo()
    console.log('USER INFO: ', userInfo)

    setSafeAuthSignInResponse(signInInfo)
    setUserInfo(userInfo || undefined)

    const web3Provider = web3AuthModalPack.getProvider()
    if (web3Provider) {
      const provider = new ethers.providers.Web3Provider(web3AuthModalPack.getProvider() as any)
      setProvider(provider)
      setChainId((await provider?.getNetwork()).chainId.toString())
      setBalance(
        ethers.utils.formatEther((await provider?.getSigner()?.getBalance()) as ethers.BigNumberish)
      )
    }
  }

  const logout = async () => {
    if (!web3AuthModalPack) return

    await web3AuthModalPack.signOut()

    setProvider(undefined)
    setSafeAuthSignInResponse(null)
  }

  const signMessage = async (message: string) => {
    await provider?.send('personal_sign', [message, '0x03cD3E862972746B9bF9a2Ba56308566FD270562'])
  }

  const sendTransaction = async () => {
    const signer = provider?.getSigner()
    const transaction = {
      to: '0xD725e11588f040d86c4C49d8236E32A5868549F0', // replace with the receiver's ethereum address
      value: ethers.utils.parseEther('0.01') // Sending 0.01 Ether
    }

    // Sending a transaction
    signer
      ?.sendTransaction(transaction)
      .then((tx) => {
        console.log(tx)
      })
      .catch((err) => {
        console.log(err)
      })
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
              prefix="gor"
            />
            <Divider sx={{ my: 2 }} />
            <Button
              variant="contained"
              fullWidth
              color="primary"
              sx={{ my: 1 }}
              onClick={() => web3AuthModalPack?.torus.showWalletUi()}
            >
              Show Wallet
            </Button>
            <Button
              variant="contained"
              fullWidth
              color="primary"
              sx={{ my: 1 }}
              onClick={() => signMessage('Hello World')}
            >
              Sign
            </Button>
            <Button
              variant="contained"
              fullWidth
              color="primary"
              sx={{ my: 1 }}
              onClick={() => sendTransaction()}
            >
              Send Transaction
            </Button>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1" sx={{ my: 1 }} color="secondary">
              ChainId: {chainId}
            </Typography>
            <Typography variant="body1" sx={{ my: 1 }} color="secondary">
              Balance: {balance}
            </Typography>
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
