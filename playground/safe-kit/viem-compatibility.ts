import { http, createWalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { SafeClientResult, safeActions } from '@safe-global/safe-kit'

import { generateTransferCallData } from '../utils'

const OWNER_1_PRIVATE_KEY = ''
const OWNER_2_PRIVATE_KEY = ''
const OWNER_3_PRIVATE_KEY = ''

const OWNER_1_ADDRESS = ''
const OWNER_2_ADDRESS = ''
const OWNER_3_ADDRESS = ''

const THRESHOLD = 3
const SALT_NONCE = ''

const RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com'
const usdcTokenAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // SEPOLIA
const usdcAmount = 10_000n // 0.01 USDC

async function send(): Promise<SafeClientResult> {
  const account = privateKeyToAccount(OWNER_1_PRIVATE_KEY as `0x{string}`)

  const safeClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(RPC_URL)
  }).extend(
    safeActions({
      safeOptions: {
        owners: [OWNER_1_ADDRESS, OWNER_2_ADDRESS, OWNER_3_ADDRESS],
        threshold: THRESHOLD,
        saltNonce: SALT_NONCE
      }
    })
  )

  const signerAddress = (await safeClient.getAddresses())[0] as string

  console.log('-Safe Address:', await safeClient.getAddress(), await safeClient.isSafeDeployed())
  console.log('-Signer Address:', signerAddress)

  const transferUSDC = {
    to: usdcTokenAddress,
    data: generateTransferCallData(signerAddress, usdcAmount),
    value: '0'
  }
  const transactions = [transferUSDC, transferUSDC]

  const txResult = await safeClient.sendSafeTransaction({ transactions })

  console.log('-Send result: ', txResult)

  return txResult
}

async function confirm({ transactions, safeAddress }: SafeClientResult, pk: string) {
  if (!pk) {
    return
  }

  const account = privateKeyToAccount(pk as `0x${string}`)

  const safeClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(RPC_URL)
  }).extend(safeActions({ safeAddress }))

  const signerAddress = (await safeClient.getAddresses())[0] as string

  console.log('-Signer Address:', signerAddress)

  const pendingTransactions = await safeClient.getPendingTransactions()

  for (const transaction of pendingTransactions.results) {
    if (transaction.safeTxHash !== transactions?.safeTxHash) {
      return
    }

    const txResult = await safeClient.confirmSafeTransaction({ safeTxHash: transaction.safeTxHash })

    console.log('-Confirm result: ', txResult)
  }
}

async function main() {
  if (![1, 2, 3].includes(THRESHOLD)) {
    return
  }

  const txResult = await send()

  if (THRESHOLD > 1) {
    await confirm(txResult, OWNER_2_PRIVATE_KEY)
  }

  //@ts-ignore-next-line
  if (THRESHOLD > 2) {
    await confirm(txResult, OWNER_3_PRIVATE_KEY)
  }
}

main()
