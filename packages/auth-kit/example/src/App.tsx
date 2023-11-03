import { useEffect, useState } from 'react'
import { Box, Button, Divider, Grid, Typography } from '@mui/material'
import { EthHashInfo } from '@safe-global/safe-react-components'
import { SUPPORTED_NETWORKS } from '@toruslabs/ethereum-controllers'
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import AppBar from './AppBar'
import {
  AuthKitSignInData,
  SafeAuthInitOptions,
  SafeAuthPack,
  SafeAuthUserInfo
} from '../../src/index'
import { ethers } from 'ethers'
import { TYPED_DATA, TYPED_DATA_V3, TYPED_DATA_V4 } from './typedData'

function App() {
  const [safeAuthPack, setSafeAuthPack] = useState<SafeAuthPack>()
  const [safeAuthSignInResponse, setSafeAuthSignInResponse] = useState<AuthKitSignInData | null>(
    null
  )
  const [userInfo, setUserInfo] = useState<SafeAuthUserInfo>()
  const [chainId, setChainId] = useState<string>()
  const [balance, setBalance] = useState<string>()
  const [consoleMessage, setConsoleMessage] = useState<string>('')
  const [consoleTitle, setConsoleTitle] = useState<string>('')
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>()

  useEffect(() => {
    ;(async () => {
      const options: SafeAuthInitOptions = {
        enableLogging: true,
        showWidgetButton: false,
        chainConfig: SUPPORTED_NETWORKS['0x64']
      }

      const safeAuthPack = new SafeAuthPack({
        txServiceUrl: 'https://safe-transaction-gnosis-chain.safe.global'
      })

      await safeAuthPack.init(options)

      safeAuthPack.subscribe('chainChanged', (result: any) =>
        console.log('safeAuthPack:chainChanged', result)
      )

      setSafeAuthPack(safeAuthPack)
    })()
  }, [])

  const login = async () => {
    if (!safeAuthPack) return

    const signInInfo = await safeAuthPack.signIn()
    console.log('SIGN IN RESPONSE: ', signInInfo)

    const userInfo = await safeAuthPack.getUserInfo()
    console.log('USER INFO: ', userInfo)

    setSafeAuthSignInResponse(signInInfo)
    setUserInfo(userInfo || undefined)

    const web3Provider = safeAuthPack.getProvider()

    if (web3Provider) {
      const provider = new ethers.providers.Web3Provider(
        safeAuthPack.getProvider() as ethers.providers.ExternalProvider
      )
      setChainId((await provider?.getNetwork()).chainId.toString())
      setBalance(
        ethers.utils.formatEther((await provider?.getSigner()?.getBalance()) as ethers.BigNumberish)
      )
      setProvider(provider)
    }
  }

  const logout = async () => {
    if (!safeAuthPack) return

    await safeAuthPack.signOut()

    setSafeAuthSignInResponse(null)
  }

  const getAccounts = async () => {
    const accounts = await provider?.send('eth_accounts', [])

    uiConsole('Accounts', accounts)
  }

  const getChainId = async () => {
    const chainId = await provider?.send('eth_chainId', [])

    uiConsole('ChainId', chainId)
  }

  const signSafeTx = async () => {
    const safeAddress = safeAuthSignInResponse?.safes?.[0] || '0x'
    const provider = new ethers.providers.Web3Provider(
      safeAuthPack?.getProvider() as ethers.providers.ExternalProvider
    )
    const signer = provider.getSigner()
    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer
    })
    const protocolKit = await Safe.create({
      safeAddress,
      ethAdapter
    })

    const tx = await protocolKit.createTransaction({
      safeTransactionData: {
        to: safeAuthSignInResponse?.eoa || '0x',
        value: '0',
        data: '0x',
        operation: 0
      }
    })

    const signedTx = await protocolKit.signTransaction(tx, 'eth_sign')

    uiConsole('Signed Safe Transaction', signedTx)

    const txResult = await protocolKit.executeTransaction(signedTx)

    uiConsole('Safe Transaction Result', txResult)
  }

  const signMessage = async (data: any, method: string) => {
    let signedMessage

    const params = {
      data,
      from: safeAuthSignInResponse?.eoa
    }

    if (method.startsWith('eth_signTypedData')) {
      // @ts-expect-error TODO: fix this
      params.version =
        method === 'eth_signTypedData' ? 'V1' : method === 'eth_signTypedData_v3' ? 'V3' : 'V4'

      signedMessage = await provider?.send(method, [data, params.from])
    } else {
      signedMessage = await provider?.getSigner()?.signMessage(data)
    }

    uiConsole('Signed Message', signedMessage)
  }

  const sendTransaction = async () => {
    const tx = await provider?.send('eth_sendTransaction', [
      {
        from: safeAuthSignInResponse?.eoa,
        to: safeAuthSignInResponse?.eoa,
        value: ethers.utils.parseUnits('0.00001', 'ether').toString(),
        gasLimit: 21000
      }
    ])

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
        isLoggedIn={!!safeAuthPack?.isAuthenticated}
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
              onClick={() => safeAuthPack?.torus.showWalletUi()}
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
              {consoleTitle}
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
