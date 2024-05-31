import SafeApiKit from '@safe-global/api-kit'
import { Safe4337Pack } from '@safe-global/relay-kit'

// Variables
const OWNER_1_PRIVATE_KEY = ''
const OWNER_2_PRIVATE_KEY = ''
const PIMLICO_API_KEY = ''
const SAFE_ADDRESS = '' // Safe 2/N
const CHAIN_NAME = 'sepolia'

// Constants
const BUNDLER_URL = `https://api.pimlico.io/v1/${CHAIN_NAME}/rpc?apikey=${PIMLICO_API_KEY}`
const PAYMASTER_URL = `https://api.pimlico.io/v2/${CHAIN_NAME}/rpc?apikey=${PIMLICO_API_KEY}`
const RPC_URL = 'https://sepolia.gateway.tenderly.co'
const PAYMASTER_ADDRESS = '0x0000000000325602a77416A16136FDafd04b299f' // SEPOLIA

const CHAIN_ID = 11155111n

async function main() {
  const apiKit = new SafeApiKit({
    chainId: CHAIN_ID
  })

  let safe4337Pack = await Safe4337Pack.init({
    provider: RPC_URL,
    signer: OWNER_1_PRIVATE_KEY,
    rpcUrl: RPC_URL,
    bundlerUrl: BUNDLER_URL,
    options: {
      owners: [OWNER_1_PRIVATE_KEY, OWNER_2_PRIVATE_KEY],
      safeAddress: SAFE_ADDRESS
    }
  })

  const safeOperation = await safe4337Pack.createTransaction({
    transactions: [
      {
        to: SAFE_ADDRESS,
        value: '0x0',
        data: '0x'
      }
    ]
  })

  let signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation)

  await apiKit.addSafeOperation(signedSafeOperation)

  const safeOperations = await apiKit.getSafeOperationsByAddress({
    safeAddress: SAFE_ADDRESS,
    ordering: '-created'
  })

  if (safeOperations.results.length >= 0) {
    safe4337Pack = await Safe4337Pack.init({
      provider: RPC_URL,
      signer: OWNER_2_PRIVATE_KEY,
      rpcUrl: RPC_URL,
      bundlerUrl: BUNDLER_URL,
      paymasterOptions: {
        isSponsored: true,
        paymasterAddress: PAYMASTER_ADDRESS,
        paymasterUrl: PAYMASTER_URL
      },
      options: {
        safeAddress: SAFE_ADDRESS
      }
    })

    signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperations.results[0])

    // Update Safe Operation??

    const userOperationHash = await safe4337Pack.executeTransaction({
      executable: signedSafeOperation
    })

    console.log(`https://jiffyscan.xyz/userOpHash/${userOperationHash}?network=${CHAIN_NAME}`)

    let userOperationReceipt = null
    while (!userOperationReceipt) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      userOperationReceipt = await safe4337Pack.getUserOperationReceipt(userOperationHash)
    }

    console.group('User Operation Receipt and hash')
    console.log('User Operation Receipt', userOperationReceipt)
    console.log(
      'User Operation By Hash',
      await safe4337Pack.getUserOperationByHash(userOperationHash)
    )
    console.groupEnd()
  }
}

main()
