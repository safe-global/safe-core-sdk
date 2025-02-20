import { privateKeyToAddress } from 'viem/accounts'
import SafeApiKit from '@safe-global/api-kit'
import { Safe4337Pack } from '@safe-global/relay-kit'
import { waitForOperationToFinish } from '../utils'

// Variables
const OWNER_1_PRIVATE_KEY = '0x'
const OWNER_2_PRIVATE_KEY = '0x'
const SAFE_ADDRESS = '0x' // Safe 2/N

const CHAIN_ID = '11155111'
const RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com'

// Constants
const BUNDLER_URL = 'https://...'
const PAYMASTER_URL = 'https://...'

async function main() {
  const apiKit = new SafeApiKit({ chainId: BigInt(CHAIN_ID) })

  let safe4337Pack = await Safe4337Pack.init({
    provider: RPC_URL,
    signer: OWNER_1_PRIVATE_KEY,
    bundlerUrl: BUNDLER_URL,
    paymasterOptions: {
      isSponsored: true,
      paymasterUrl: PAYMASTER_URL
    },
    options: {
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

  const safeOperationHash = safeOperation.getHash()
  console.log('SafeOperation hash =', safeOperationHash)

  const safeOpSignedByOwner1 = await safe4337Pack.signSafeOperation(safeOperation)
  const signature1 = safeOpSignedByOwner1.getSignature(
    privateKeyToAddress(OWNER_1_PRIVATE_KEY)
  )!.data

  console.log('Signed by first owner:', signature1)

  await apiKit.addSafeOperation(safeOpSignedByOwner1)

  const addedSafeOperation = await apiKit.getSafeOperation(safeOperationHash)
  console.log('Added to the Transaction service')

  safe4337Pack = await Safe4337Pack.init({
    provider: RPC_URL,
    signer: OWNER_2_PRIVATE_KEY,
    bundlerUrl: BUNDLER_URL,
    paymasterOptions: {
      isSponsored: true,
      paymasterUrl: PAYMASTER_URL
    },
    options: {
      safeAddress: SAFE_ADDRESS
    }
  })

  const safeOpSignedByOwner2 = await safe4337Pack.signSafeOperation(addedSafeOperation)
  const signature2 = safeOpSignedByOwner2.getSignature(
    privateKeyToAddress(OWNER_2_PRIVATE_KEY)
  )!.data

  console.log('Signed by second owner:', signature2)

  // Confirm the safe operation with the second owner
  await apiKit.confirmSafeOperation(safeOperationHash, signature2)

  const confirmedSafeOperation = await apiKit.getSafeOperation(safeOperationHash)
  console.log('Confirmed to the Transaction service')

  const userOperationHash = await safe4337Pack.executeTransaction({
    executable: confirmedSafeOperation
  })
  console.log('Executing the SafeOperation...')

  await waitForOperationToFinish(userOperationHash, CHAIN_ID, safe4337Pack)
}

main()
