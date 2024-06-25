import { createSafeClient } from '@safe-global/safe-kit'
import { generateTransferCallData } from '../utils'

const OWNER_1_PRIVATE_KEY = ''
const OWNER_1_ADDRESS = ''

const RPC_URL = 'https://sepolia.gateway.tenderly.co'
const usdcTokenAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // SEPOLIA
const usdcAmount = 10_000n // 0.01 USDC

async function main() {
  const safeClient = await createSafeClient({
    provider: RPC_URL,
    signer: OWNER_1_PRIVATE_KEY,
    safeOptions: {
      owners: [OWNER_1_ADDRESS],
      threshold: 1,
      saltNonce: '1'
    }
  })

  const signerAddress = (await safeClient.protocolKit.getSafeProvider().getSignerAddress()) || '0x'

  console.log(
    '-Safe Address:',
    await safeClient.protocolKit.getAddress(),
    await safeClient.protocolKit.isSafeDeployed()
  )
  console.log('-Signer Address:', signerAddress)

  const transferUSDC = {
    to: usdcTokenAddress,
    data: generateTransferCallData(signerAddress, usdcAmount),
    value: '0'
  }
  const transactions = [transferUSDC, transferUSDC]

  const {
    chain: { hash }
  } = await safeClient.send(transactions)

  console.log(`-Transaction hash: ${hash}`)
}

main()
