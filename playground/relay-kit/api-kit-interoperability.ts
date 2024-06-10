import SafeApiKit from '@safe-global/api-kit'
import { Safe4337Pack } from '@safe-global/relay-kit'
import { sortResultsByCreatedDateDesc, waitForOperationToFinish } from '../utils'

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

  console.log('SafeOperation signature 1', signedSafeOperation)
  await apiKit.addSafeOperation(signedSafeOperation)

  let safeOperations = await apiKit.getSafeOperationsByAddress({
    safeAddress: SAFE_ADDRESS,
    ordering: '-created'
  })

  if (safeOperations.results.length >= 0) {
    safe4337Pack = await Safe4337Pack.init({
      provider: RPC_URL,
      signer: OWNER_2_PRIVATE_KEY,
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

    signedSafeOperation = await safe4337Pack.signSafeOperation(
      sortResultsByCreatedDateDesc(safeOperations).results[0]
    )

    console.log('SafeOperation signature 2', signedSafeOperation)

    // TODO. This should be the place to confirm the safe operation but the api endpoint is not available yet
    // Update this once the new endpoint is released
    await apiKit.addSafeOperation(signedSafeOperation)

    safeOperations = await apiKit.getSafeOperationsByAddress({
      safeAddress: SAFE_ADDRESS,
      ordering: '-created'
    })

    console.log('SafeOperationList', safeOperations)

    const userOperationHash = await safe4337Pack.executeTransaction({
      executable: sortResultsByCreatedDateDesc(safeOperations).results[0]
    })

    await waitForOperationToFinish(userOperationHash, CHAIN_NAME, safe4337Pack)
  }
}

main()
