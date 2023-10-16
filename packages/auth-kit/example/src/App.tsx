import { useEffect, useState } from 'react'
import { Box, Button, Divider, Grid, Typography } from '@mui/material'
import { EthHashInfo } from '@safe-global/safe-react-components'
import { TorusParams, UserInfo } from '@web3auth/ws-embed'

import AppBar from './AppBar'
import { AuthKitSignInData, Web3AuthPack } from '../../src/index'
import { ethers } from 'ethers'

function App() {
  const [web3AuthPack, setWeb3AuthPack] = useState<Web3AuthPack>()
  const [safeAuthSignInResponse, setSafeAuthSignInResponse] = useState<AuthKitSignInData | null>(
    null
  )
  const [userInfo, setUserInfo] = useState<UserInfo>()
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

      const web3AuthPack = new Web3AuthPack({
        txServiceUrl: 'https://safe-transaction-goerli.safe.global'
      })

      await web3AuthPack.init(options)

      web3AuthPack.subscribe('chainChanged', (result: any) =>
        console.log('web3authpack:chainChanged', result)
      )

      setWeb3AuthPack(web3AuthPack)
    })()
  }, [])

  const login = async () => {
    if (!web3AuthPack) return

    const signInInfo = await web3AuthPack.signIn()
    console.log('SIGN IN RESPONSE: ', signInInfo)

    const userInfo = await web3AuthPack.getUserInfo()
    console.log('USER INFO: ', userInfo)

    setSafeAuthSignInResponse(signInInfo)
    setUserInfo(userInfo || undefined)

    const web3Provider = web3AuthPack.getProvider()

    if (web3Provider) {
      const provider = new ethers.providers.Web3Provider(
        web3AuthPack.getProvider() as ethers.providers.ExternalProvider
      )
      setProvider(provider)
      setChainId((await provider?.getNetwork()).chainId.toString())
      setBalance(
        ethers.utils.formatEther((await provider?.getSigner()?.getBalance()) as ethers.BigNumberish)
      )
    }
  }

  const logout = async () => {
    if (!web3AuthPack) return

    await web3AuthPack.signOut()

    setProvider(undefined)
    setSafeAuthSignInResponse(null)
  }

  const signMessage = async (message: string) => {
    // TODO. Should allow to wrap using ethers or web3
    await web3AuthPack?.torus.provider.sendAsync({
      method: 'personal_sign',
      params: {
        data: message,
        from: safeAuthSignInResponse?.eoa
      }
    })
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
      <AppBar
        onLogin={login}
        onLogout={logout}
        userInfo={userInfo}
        isLoggedIn={!!web3AuthPack?.isAuthenticated}
      />
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
              onClick={() => web3AuthPack?.torus.showWalletUi()}
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
