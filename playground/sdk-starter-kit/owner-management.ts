import * as dotenv from 'dotenv'
import { Hex } from 'viem'
import { createSafeClient } from '@safe-global/sdk-starter-kit'
import { Address } from '@safe-global/types-kit'
import { privateKeyToAddress } from 'viem/accounts'

dotenv.config({ path: './playground/sdk-starter-kit/.env' })

// Load environment variables from ./.env file
// Follow .env-sample as an example to create your own file
const {
  OWNER_1_PRIVATE_KEY = '0x',
  OWNER_2_PRIVATE_KEY = '0x',
  SAFE_ADDRESS = '0x',
  RPC_URL = ''
} = process.env

const safeAddress = SAFE_ADDRESS as Address

async function addOwner() {
  const safeClient = await createSafeClient({
    provider: RPC_URL,
    signer: OWNER_1_PRIVATE_KEY,
    safeAddress
  })

  const owner2 = privateKeyToAddress(OWNER_2_PRIVATE_KEY as Hex)

  const transaction = await safeClient.createAddOwnerTransaction({
    ownerAddress: owner2,
    threshold: 2
  })

  const transactionResult = await safeClient.send({ transactions: [transaction] })

  console.log('Add Owner Transaction Result', transactionResult)
}

async function removeOwner() {
  const safeClient1 = await createSafeClient({
    provider: RPC_URL,
    signer: OWNER_1_PRIVATE_KEY,
    safeAddress
  })

  const safeClient2 = await createSafeClient({
    provider: RPC_URL,
    signer: OWNER_2_PRIVATE_KEY,
    safeAddress
  })

  const owner2 = privateKeyToAddress(OWNER_2_PRIVATE_KEY as Hex)

  const transaction = await safeClient1.createRemoveOwnerTransaction({
    ownerAddress: owner2,
    threshold: 1
  })
  const sendResult = await safeClient1.send({ transactions: [transaction] })

  const transactionResult = await safeClient2.confirm({
    safeTxHash: sendResult.transactions?.safeTxHash || ''
  })
  console.log('Remove Owner Transaction Result', transactionResult)
}

async function safeInfo() {
  const safeClient = await createSafeClient({
    provider: RPC_URL,
    signer: OWNER_1_PRIVATE_KEY,
    safeAddress
  })

  console.log('Safe Address', await safeClient.protocolKit.getAddress())
  console.log('Owners', await safeClient.getOwners())
  console.log('Threshold', await safeClient.getThreshold())
  console.log('Nonce', await safeClient.getNonce())
}

async function main() {
  await safeInfo()
  await addOwner()

  console.log('Waiting for transaction to be indexed ...')
  setTimeout(async () => {
    await safeInfo()
    await removeOwner()
  }, 10000)
}

main()
