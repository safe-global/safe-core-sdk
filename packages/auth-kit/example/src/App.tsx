import { useEffect, useState } from 'react'
import { Box, Button, Divider, Grid, Typography } from '@mui/material'
import { EthHashInfo } from '@safe-global/safe-react-components'
import { TorusParams, UserInfo } from '@web3auth/ws-embed'
import { SUPPORTED_NETWORKS } from '@toruslabs/ethereum-controllers'
import Safe, { EthersAdapter, Web3Adapter } from '@safe-global/protocol-kit'
import AppBar from './AppBar'
import { AuthKitSignInData, Web3AuthPack } from '../../src/index'
import { ethers } from 'ethers'
import { TYPED_DATA, TYPED_DATA_V3, TYPED_DATA_V4 } from './typedData'
import Web3 from 'web3'

function App() {
  const [web3AuthPack, setWeb3AuthPack] = useState<Web3AuthPack>()
  const [safeAuthSignInResponse, setSafeAuthSignInResponse] = useState<AuthKitSignInData | null>(
    null
  )
  const [userInfo, setUserInfo] = useState<UserInfo>()
  const [chainId, setChainId] = useState<string>()
  const [balance, setBalance] = useState<string>()
  const [consoleMessage, setConsoleMessage] = useState<string>('')
  const [consoleTitle, setConsoleTitle] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      const options: TorusParams = {
        enableLogging: true,
        showWidgetButton: false,
        chainConfig: SUPPORTED_NETWORKS['0x1']
      }

      const web3AuthPack = new Web3AuthPack({
        txServiceUrl: 'https://safe-transaction-mainnet.safe.global'
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

    const signInInfo = await web3AuthPack.signIn({
      loginProvider: 'google'
    })
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
      setChainId((await provider?.getNetwork()).chainId.toString())
      setBalance(
        ethers.utils.formatEther((await provider?.getSigner()?.getBalance()) as ethers.BigNumberish)
      )
    }
  }

  const logout = async () => {
    if (!web3AuthPack) return

    await web3AuthPack.signOut()

    setSafeAuthSignInResponse(null)
  }

  const getAccounts = async () => {
    const accounts = await web3AuthPack?.torus.provider.sendAsync({
      method: 'eth_accounts'
    })

    uiConsole('Accounts', accounts)
  }

  const getChainId = async () => {
    const chainId = await web3AuthPack?.torus.provider.sendAsync({
      method: 'eth_chainId'
    })

    uiConsole('ChainId', chainId)
  }

  const signSafeTx = async () => {
    const protocolKit = await Safe.create({
      safeAddress: safeAuthSignInResponse?.safes?.[0] || '0x',
      ethAdapter: new EthersAdapter({
        ethers,
        signerOrProvider: new ethers.providers.Web3Provider(
          web3AuthPack?.getProvider() as ethers.providers.ExternalProvider
        ).getSigner()
      })
    })

    // const protocolKit = await Safe.create({
    //   safeAddress: safeAuthSignInResponse?.safes?.[0] || '0x',
    //   ethAdapter: new Web3Adapter({
    //     web3: new Web3(web3AuthPack?.getProvider() as any) as any,
    //     signerAddress: safeAuthSignInResponse?.eoa || '0x'
    //   })
    // })

    const tx = await protocolKit.createTransaction({
      safeTransactionData: {
        to: safeAuthSignInResponse?.eoa || '0x',
        value: '0',
        data: '0x',
        operation: 0
      }
    })

    const signedTx = await protocolKit.signTransaction(tx, 'eth_sign')

    // await protocolKit.executeTransaction(signedTx)
  }

  const signMessage = async (data: any, method: string) => {
    // const ethersProvider = new ethers.providers.Web3Provider(
    //   web3AuthPack?.getProvider() as ethers.providers.ExternalProvider
    // )
    // const signer = ethersProvider.getSigner()
    // const signedMessage = await signer.signMessage(data)

    const params = {
      data,
      from: safeAuthSignInResponse?.eoa
    }

    if (method.startsWith('eth_signTypedData')) {
      // @ts-expect-error TODO: fix this
      params.version =
        method === 'eth_signTypedData' ? 'V1' : method === 'eth_signTypedData_v3' ? 'V3' : 'V4'
    }

    const signedMessage = await web3AuthPack?.torus.provider.sendAsync({
      method,
      params
    })

    uiConsole('Signed Message', signedMessage)
  }

  const sendTransaction = async () => {
    const tx = await web3AuthPack?.torus?.provider?.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: safeAuthSignInResponse?.eoa,
          to: safeAuthSignInResponse?.eoa,
          value: ethers.utils.parseUnits('0.00001', 'ether').toString(),
          gasLimit: 21000
        }
      ]
    })

    uiConsole('Transaction Response', tx)
  }

  const uiConsole = (title: string, message: unknown) => {
    setConsoleTitle(title)
    setConsoleMessage(typeof message === 'string' ? message : JSON.stringify(message, null, 2))
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
            <EthHashInfo address={safeAuthSignInResponse.eoa} showCopyButton showPrefix={false} />
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
              onClick={() => getAccounts()}
            >
              eth_accounts
            </Button>
            <Button
              variant="contained"
              fullWidth
              color="primary"
              sx={{ my: 1 }}
              onClick={() => getChainId()}
            >
              eth_chainId
            </Button>
            <Button
              variant="contained"
              fullWidth
              color="primary"
              sx={{ my: 1 }}
              onClick={() => signMessage('Hello World', 'personal_sign')}
            >
              personal_sign
            </Button>
            <Button
              variant="contained"
              fullWidth
              color="primary"
              sx={{ my: 1 }}
              onClick={() =>
                signMessage(
                  '0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad',
                  'eth_sign'
                )
              }
            >
              eth_sign
            </Button>
            <Button
              variant="contained"
              fullWidth
              color="primary"
              sx={{ my: 1 }}
              onClick={() => signMessage(TYPED_DATA, 'eth_signTypedData')}
            >
              eth_signTypedData
            </Button>
            <Button
              variant="contained"
              fullWidth
              color="primary"
              sx={{ my: 1 }}
              onClick={() => signMessage(TYPED_DATA_V3, 'eth_signTypedData_v3')}
            >
              eth_signTypedData_v3
            </Button>
            <Button
              variant="contained"
              fullWidth
              color="primary"
              sx={{ my: 1 }}
              onClick={() => signMessage(TYPED_DATA_V4, 'eth_signTypedData_v4')}
            >
              eth_signTypedData_v4
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
          <Grid item md={4} p={4}>
            <>
              <Typography variant="h3" color="secondary" fontWeight={700}>
                Available Safes
              </Typography>
              <Divider sx={{ my: 2 }} />
              {safeAuthSignInResponse?.safes?.length ? (
                safeAuthSignInResponse?.safes?.map((safe, index) => (
                  <>
                    <Box sx={{ my: 3 }} key={index}>
                      <EthHashInfo address={safe} showCopyButton shortAddress={false} />
                    </Box>
                    <Divider sx={{ my: 3 }} />
                    <Button
                      variant="contained"
                      fullWidth
                      color="primary"
                      onClick={() => signSafeTx()}
                    >
                      Sign Safe Transaction
                    </Button>
                  </>
                ))
              ) : (
                <Typography variant="body1" color="secondary" fontWeight={700}>
                  No Available Safes
                </Typography>
              )}
            </>
          </Grid>
          <Grid item md={4} p={4}>
            <Typography variant="h3" color="secondary" fontWeight={700}>
              Console
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1" color="primary" fontWeight={700}>
              {consoleTitle}:
            </Typography>
            <Typography
              variant="body1"
              color="secondary"
              sx={{ mt: 2, overflowWrap: 'break-word' }}
            >
              {consoleMessage}
            </Typography>
          </Grid>
        </Grid>
      )}
    </>
  )
}

export default App
