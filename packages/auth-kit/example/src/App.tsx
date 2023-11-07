import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { SUPPORTED_NETWORKS } from '@toruslabs/ethereum-controllers'
import { Box, Button, Divider, Grid, Typography } from '@mui/material'
import { EthHashInfo } from '@safe-global/safe-react-components'
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import AppBar from './AppBar'
import {
  AuthKitSignInData,
  SafeAuthInitOptions,
  SafeAuthPack,
  SafeAuthUserInfo
} from '../../src/index'
import { getTypedData, getV3TypedData, getV4TypedData } from './typedData'

function App() {
  const [safeAuthPack, setSafeAuthPack] = useState<SafeAuthPack>()
  const [isAuthenticated, setIsAuthenticated] = useState(!!safeAuthPack?.isAuthenticated)
  const [safeAuthSignInResponse, setSafeAuthSignInResponse] = useState<AuthKitSignInData | null>(
    null
  )
  const [userInfo, setUserInfo] = useState<SafeAuthUserInfo | null>(null)
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

      const authPack = new SafeAuthPack({
        txServiceUrl: 'https://safe-transaction-gnosis-chain.safe.global'
      })

      await authPack.init(options)

      setSafeAuthPack(authPack)

      // If the provider has an account the we can try to sign in the user
      authPack.subscribe('accountsChanged', async (accounts) => {
        console.log('safeAuthPack:accountsChanged', accounts, authPack.isAuthenticated)

        if (accounts.length > 0) {
          const signInInfo = await authPack?.signIn()

          setSafeAuthSignInResponse(signInInfo)
          setIsAuthenticated(true)
        }
      })

      authPack.subscribe('chainChanged', (eventData) =>
        console.log('safeAuthPack:chainChanged', eventData)
      )
    })()
  }, [])

  useEffect(() => {
    if (!safeAuthPack || !isAuthenticated) return
    ;(async () => {
      const web3Provider = safeAuthPack.getProvider()
      const userInfo = await safeAuthPack.getUserInfo()

      setUserInfo(userInfo)

      if (web3Provider) {
        const provider = new ethers.providers.Web3Provider(
          safeAuthPack.getProvider() as ethers.providers.ExternalProvider
        )
        setChainId((await provider?.getNetwork()).chainId.toString())
        setBalance(
          ethers.utils.formatEther(
            (await provider?.getSigner()?.getBalance()) as ethers.BigNumberish
          )
        )
        setProvider(provider)
      }
    })()
  }, [isAuthenticated])

  const login = async () => {
    if (!safeAuthPack) return

    const signInInfo = await safeAuthPack?.signIn()
    setSafeAuthSignInResponse(signInInfo)
  }

  const logout = async () => {
    if (!safeAuthPack) return

    await safeAuthPack.signOut()

    setSafeAuthSignInResponse(null)
  }

  const getUserInfo = async () => {
    const userInfo = await safeAuthPack?.getUserInfo()

    uiConsole('User Info', userInfo)
  }

  const getAccounts = async () => {
    const accounts = await provider?.send('eth_accounts', [])

    uiConsole('Accounts', accounts)
  }

  const getChainId = async () => {
    const chainId = await provider?.send('eth_chainId', [])

    uiConsole('ChainId', chainId)
  }

  const signAndExecuteSafeTx = async () => {
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
    console.log(data)
    const params = {
      data: JSON.stringify(data),
      from: safeAuthSignInResponse?.eoa
    }

    if (method.startsWith('eth_signTypedData')) {
      // @ts-expect-error TODO: fix this
      params.version =
        method === 'eth_signTypedData' ? 'V1' : method === 'eth_signTypedData_v3' ? 'V3' : 'V4'

      signedMessage = await provider?.send(method, [params.from, params.data])
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

  const switchChain = async () => {
    const result = await provider?.send('wallet_switchEthereumChain', [
      {
        chainId: '0x1'
      }
    ])

    uiConsole('Switch Chain', result)
  }

  const addChain = async () => {
    const result = await provider?.send('wallet_addEthereumChain', [
      {
        chainId: '0x2105',
        chainName: 'Base',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['https://base.publicnode.com'],
        blockExplorerUrls: ['https://basescan.org/']
      }
    ])

    uiConsole(`Add chain`, result)
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
        userInfo={userInfo || undefined}
        isLoggedIn={!!safeAuthPack?.isAuthenticated}
      />
      {safeAuthSignInResponse?.eoa && (
        <Grid container>
          <Grid item md={4} p={4}>
            <Typography variant="h3" color="secondary" fontWeight={700}>
              Signer
            </Typography>
            <Divider sx={{ my: 3 }} />
            <EthHashInfo address={safeAuthSignInResponse.eoa} showCopyButton showPrefix={false} />
            <Divider sx={{ my: 2 }} />
            <Typography variant="h5" color="primary">
              Chain{' '}
              <Typography variant="h3" color="secondary" fontWeight="bold">
                {chainId}
              </Typography>
            </Typography>
            <Typography variant="h5" color="primary" sx={{ my: 1 }}>
              Balance{' '}
              <Typography variant="h3" color="secondary" fontWeight="bold">
                {balance}
              </Typography>
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Button
              variant="contained"
              fullWidth
              color="secondary"
              sx={{ my: 1 }}
              onClick={() => getUserInfo()}
            >
              getUserInfo
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ my: 1 }}
              onClick={() => getAccounts()}
            >
              eth_accounts
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ my: 1 }}
              onClick={() => getChainId()}
            >
              eth_chainId
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ my: 1 }}
              onClick={() => signMessage('Hello World', 'personal_sign')}
            >
              personal_sign
            </Button>
            <Button
              fullWidth
              variant="contained"
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
              fullWidth
              variant="contained"
              color="primary"
              sx={{ my: 1 }}
              onClick={() => signMessage(getTypedData(), 'eth_signTypedData')}
            >
              eth_signTypedData
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ my: 1 }}
              onClick={() => signMessage(getV3TypedData(chainId || ''), 'eth_signTypedData_v3')}
            >
              eth_signTypedData_v3
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ my: 1 }}
              onClick={() => signMessage(getV4TypedData(chainId || ''), 'eth_signTypedData_v4')}
            >
              eth_signTypedData_v4
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ my: 1 }}
              onClick={() => sendTransaction()}
            >
              eth_sendTransaction
            </Button>
            <Divider sx={{ my: 2 }} />
            <Button
              variant="outlined"
              fullWidth
              color="secondary"
              sx={{ my: 1 }}
              onClick={() => switchChain()}
            >
              wallet_switchEthereumChain
            </Button>{' '}
            <Button
              variant="outlined"
              fullWidth
              color="secondary"
              sx={{ my: 1 }}
              onClick={() => addChain()}
            >
              wallet_addEthereumChain
            </Button>
          </Grid>
          <Grid item md={3} p={4}>
            <>
              <Typography variant="h3" color="secondary" fontWeight={700}>
                Safe accounts
              </Typography>
              <Divider sx={{ my: 2 }} />
              {safeAuthSignInResponse?.safes?.length ? (
                safeAuthSignInResponse?.safes?.map((safe, index) => (
                  <>
                    <Box sx={{ my: 3 }} key={index}>
                      <EthHashInfo address={safe} showCopyButton shortAddress={true} />
                    </Box>
                    <Button
                      variant="contained"
                      fullWidth
                      color="primary"
                      onClick={() => signAndExecuteSafeTx()}
                    >
                      Sign and execute
                    </Button>
                    <Divider sx={{ my: 3 }} />
                  </>
                ))
              ) : (
                <Typography variant="body1" color="secondary" fontWeight={700}>
                  No Available Safes
                </Typography>
              )}
            </>
          </Grid>
          <Grid item md={5} p={4}>
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
