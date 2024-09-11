import { privateKeyToAddress } from 'viem/accounts'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { SafeClientResult, createSafeClient, safeOperations } from '@safe-global/sdk-starter-kit'
import { generateTransferCallData } from '../utils'

const OWNER_1_PRIVATE_KEY = '0x'
const OWNER_2_PRIVATE_KEY = '0x'
const OWNER_3_PRIVATE_KEY = '0x'

const THRESHOLD = 3
const SALT_NONCE = ''

const RPC_URL = 'https://rpc.sepolia.org'
const usdcTokenAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // SEPOLIA
const usdcAmount = 10_000n // 0.01 USDC

// Paymaster URL
const PIMLICO_API_KEY = ''
const PAYMASTER_URL = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_API_KEY}` // PIMLICO
const BUNDLER_URL = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_API_KEY}`

async function send(): Promise<SafeClientResult> {
  const owner1 = privateKeyToAddress(OWNER_1_PRIVATE_KEY)
  const owner2 = privateKeyToAddress(OWNER_2_PRIVATE_KEY)
  const owner3 = privateKeyToAddress(OWNER_3_PRIVATE_KEY)

  const safeClient = await createSafeClient({
    provider: RPC_URL,
    signer: OWNER_1_PRIVATE_KEY,
    safeOptions: {
      owners: [owner1, owner2, owner3],
      threshold: THRESHOLD,
      saltNonce: SALT_NONCE
    }
  })

  const safeClientWithSafeOperation = await safeClient.extend(
    safeOperations({ bundlerUrl: BUNDLER_URL }, { isSponsored: true, paymasterUrl: PAYMASTER_URL })
  )

  const signerAddress =
    (await safeClientWithSafeOperation.protocolKit.getSafeProvider().getSignerAddress()) || '0x'

  console.log(
    '-Safe Address:',
    await safeClientWithSafeOperation.protocolKit.getAddress(),
    await safeClientWithSafeOperation.protocolKit.isSafeDeployed()
  )
  console.log('-Signer Address:', signerAddress)

  const transferUSDC = {
    to: usdcTokenAddress,
    data: generateTransferCallData(signerAddress, usdcAmount),
    value: '0'
  }
  const transactions = [transferUSDC, transferUSDC]

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC_URL)
  })

  const timestamp = (await publicClient.getBlock())?.timestamp || 0n

  const safeOperationResult = await safeClientWithSafeOperation.sendSafeOperation({
    transactions,
    validAfter: Number(timestamp - 60_000n),
    validUntil: Number(timestamp + 60_000n)
  })

  console.log('-Send result: ', safeOperationResult)

  return safeOperationResult
}

async function confirm(safeClientResult: SafeClientResult, pk: string) {
  if (!pk) {
    return
  }

  const owner1 = privateKeyToAddress(OWNER_1_PRIVATE_KEY)
  const owner2 = privateKeyToAddress(OWNER_2_PRIVATE_KEY)
  const owner3 = privateKeyToAddress(OWNER_3_PRIVATE_KEY)

  const safeClient = await createSafeClient({
    provider: RPC_URL,
    signer: pk,
    safeOptions: {
      owners: [owner1, owner2, owner3],
      threshold: THRESHOLD,
      saltNonce: SALT_NONCE
    }
  })

  const signerAddress = (await safeClient.protocolKit.getSafeProvider().getSignerAddress()) || '0x'

  console.log('-Signer Address:', signerAddress)

  const safeClientWithSafeOperation = await safeClient.extend(
    safeOperations({ bundlerUrl: BUNDLER_URL }, { isSponsored: true, paymasterUrl: PAYMASTER_URL })
  )

  const pendingSafeOperations = await safeClientWithSafeOperation.getPendingSafeOperations()

  for (const safeOperation of pendingSafeOperations.results) {
    if (safeOperation.safeOperationHash !== safeClientResult.safeOperations?.safeOperationHash) {
      return
    }

    const safeOperationResult = await safeClientWithSafeOperation.confirmSafeOperation({
      safeOperationHash: safeClientResult.safeOperations?.safeOperationHash
    })

    console.log('-Confirm result: ', safeOperationResult)
  }
}

async function main() {
  if (![1, 2, 3].includes(THRESHOLD)) {
    return
  }

  const safeOperationResult = await send()

  if (THRESHOLD > 1) {
    await confirm(safeOperationResult, OWNER_2_PRIVATE_KEY)
  }

  //@ts-ignore-next-line
  if (THRESHOLD > 2) {
    await confirm(safeOperationResult, OWNER_3_PRIVATE_KEY)
  }
}

main()
