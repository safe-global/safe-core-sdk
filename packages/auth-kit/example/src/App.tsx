import { useEffect, useState } from 'react'
import { BrowserProvider, Eip1193Provider, ethers } from 'ethers'
import { SUPPORTED_NETWORKS } from '@toruslabs/ethereum-controllers'
import { Box, Button, Divider, Grid, Typography } from '@mui/material'
import { EthHashInfo } from '@safe-global/safe-react-components'
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import AppBar from './AppBar'
import {
  AuthKitSignInData,
  SafeAuthInitOptions,
  SafeAuthPack,
  SafeAuthUserInfo
} from '../../src/index'
import { getSafeTxV4TypedData, getTypedData, getV3TypedData } from './typedData'
import { SignTypedDataVersion, recoverTypedSignature } from '@metamask/eth-sig-util'

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
  const [provider, setProvider] = useState<BrowserProvider>()

  useEffect(() => {
    ;(async () => {
      const options: SafeAuthInitOptions = {
        enableLogging: true,
        buildEnv: 'production',
        chainConfig: SUPPORTED_NETWORKS['0x64']
      }

      const authPack = new SafeAuthPack()

      await authPack.init(options)

      console.log('safeAuthPack:safeEmbed', authPack.safeAuthEmbed)

      setSafeAuthPack(authPack)

      authPack.subscribe('accountsChanged', async (accounts) => {
        console.log('safeAuthPack:accountsChanged', accounts, authPack.isAuthenticated)
        if (authPack.isAuthenticated) {
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
        const provider = new BrowserProvider(safeAuthPack.getProvider() as Eip1193Provider)
        const signer = await provider.getSigner()
        const signerAddress = await signer.getAddress()

        setChainId((await provider?.getNetwork()).chainId.toString())
        setBalance(
          ethers.formatEther((await provider.getBalance(signerAddress)) as ethers.BigNumberish)
        )
        setProvider(provider)
      }
    })()
  }, [isAuthenticated])

  const login = async () => {
    const signInInfo = await safeAuthPack?.signIn()

    setSafeAuthSignInResponse(signInInfo)
    setIsAuthenticated(true)
  }

  const logout = async () => {
    await safeAuthPack?.signOut()

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

  const signAndExecuteSafeTx = async (index: number) => {
    const safeAddress = safeAuthSignInResponse?.safes?.[index] || '0x'

    // Web3Auth provider wrapped with ethers
    // -------------------------------------
    const provider = new BrowserProvider(safeAuthPack?.getProvider() as Eip1193Provider)
    const signer = await provider.getSigner()
    const ethersAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer
    })
    const protocolKit = await Safe.create({
      safeAddress,
      ethAdapter: ethersAdapter
    })
    // -------------------------------------

    // ethers.Wallet as signer
    // -------------------------------------
    // const signer = new ethers.Wallet(
    //   import.meta.env.VITE_PRIVATE_KEY,
    //   new ethers.providers.JsonRpcProvider(SUPPORTED_NETWORKS['0x64'].rpcTarget)
    // )
    // const ethersAdapter = new EthersAdapter({
    //   ethers,
    //   signerOrProvider: signer
    // })
    // const protocolKit = await Safe.create({
    //   safeAddress,
    //   ethAdapter: ethersAdapter
    // })
    // -------------------------------------

    const chainId = await ethersAdapter.getChainId()
    let tx = await protocolKit.createTransaction({
      safeTransactionData: {
        to: ethers.getAddress(safeAuthSignInResponse?.eoa || '0x'),
        data: '0x',
        value: ethers.parseUnits('0.0001', 'ether').toString()
      }
    })

    tx = await protocolKit.signTransaction(tx)
    const signerAddress = (await ethersAdapter.getSignerAddress())?.toLowerCase()
    const signature = tx.signatures.get(signerAddress || '')
    const verify = ethers.verifyTypedData(
      { verifyingContract: safeAddress, chainId },
      {
        SafeTx: [
          { type: 'address', name: 'to' },
          { type: 'uint256', name: 'value' },
          { type: 'bytes', name: 'data' },
          { type: 'uint8', name: 'operation' },
          { type: 'uint256', name: 'safeTxGas' },
          { type: 'uint256', name: 'baseGas' },
          { type: 'uint256', name: 'gasPrice' },
          { type: 'address', name: 'gasToken' },
          { type: 'address', name: 'refundReceiver' },
          { type: 'uint256', name: 'nonce' }
        ]
      },
      {
        ...tx.data,
        value: tx.data.value,
        safeTxGas: tx.data.safeTxGas,
        baseGas: tx.data.baseGas,
        gasPrice: tx.data.gasPrice,
        nonce: tx.data.nonce
      },
      signature?.data || '0x'
    )
    const verifyTypedData = recoverTypedSignature({
      data: {
        types: {
          EIP712Domain: [
            {
              name: 'chainId',
              type: 'uint256'
            },
            {
              name: 'verifyingContract',
              type: 'address'
            }
          ],
          SafeTx: [
            { type: 'address', name: 'to' },
            { type: 'uint256', name: 'value' },
            { type: 'bytes', name: 'data' },
            { type: 'uint8', name: 'operation' },
            { type: 'uint256', name: 'safeTxGas' },
            { type: 'uint256', name: 'baseGas' },
            { type: 'uint256', name: 'gasPrice' },
            { type: 'address', name: 'gasToken' },
            { type: 'address', name: 'refundReceiver' },
            { type: 'uint256', name: 'nonce' }
          ]
        },
        primaryType: 'SafeTx',
        domain: { verifyingContract: safeAddress, chainId: 100 },
        message: {
          ...tx.data,
          value: tx.data.value,
          safeTxGas: tx.data.safeTxGas,
          baseGas: tx.data.baseGas,
          gasPrice: tx.data.gasPrice,
          nonce: tx.data.nonce
        }
      },
      signature: signature?.data || '0x',
      version: SignTypedDataVersion.V4
    })

    console.log('Verify: Signer Address:', signerAddress?.toLowerCase())
    console.log(
      'Ethers Verify: Result:',
      verify,
      verify.toLowerCase() === signerAddress?.toLowerCase()
    )
    console.log(
      'Metamash Verify: Result:',
      verifyTypedData,
      verifyTypedData.toLowerCase() === signerAddress?.toLowerCase()
    )

    // Propose transaction
    // -------------------------------------
    const safeApiKit = new SafeApiKit({
      chainId: 100n
    })
    const safeTxHash = await protocolKit.getTransactionHash(tx)
    await safeApiKit.proposeTransaction({
      safeAddress,
      safeTransactionData: tx.data,
      safeTxHash,
      senderAddress: ethers.getAddress(signerAddress || ''),
      senderSignature: signature?.data || ''
    })
    // -------------------------------------

    // Execute transaction
    // -------------------------------------
    // const txResult = await protocolKit.executeTransaction(tx)
    // uiConsole('Safe Transaction Result', txResult)
    //-------------------------------------
  }

  const signMessage = async (data: any, method: string) => {
    let signedMessage

    const params = {
      data,
      from: safeAuthSignInResponse?.eoa
    }

    if (method === 'eth_signTypedData') {
      signedMessage = await provider?.send(method, [params.data, params.from])
    } else if (method === 'eth_signTypedData_v3' || method === 'eth_signTypedData_v4') {
      signedMessage = await provider?.send(method, [params.from, JSON.stringify(params.data)])
    } else {
      signedMessage = await (await provider?.getSigner())?.signMessage(data)
    }

    uiConsole('Signed Message', signedMessage)
  }

  const sendTransaction = async () => {
    const tx = await provider?.send('eth_sendTransaction', [
      {
        from: safeAuthSignInResponse?.eoa,
        to: safeAuthSignInResponse?.eoa,
        value: ethers.parseUnits('0.00001', 'ether').toString(),
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
            <Typography variant="h4" color="primary" fontWeight="bold">
              Chain{' '}
              <Typography component="span" color="secondary" fontSize="1.45rem">
                {chainId}
              </Typography>
            </Typography>
            <Typography variant="h4" color="primary" sx={{ my: 1 }} fontWeight="bold">
              Balance{' '}
              <Typography component="span" color="secondary" fontSize="1.45rem">
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
              onClick={() =>
                signMessage(getSafeTxV4TypedData(chainId || ''), 'eth_signTypedData_v4')
              }
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
                      onClick={() => signAndExecuteSafeTx(index)}
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
