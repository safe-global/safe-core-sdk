import { createSafeClient } from '@safe-global/sdk-starter-kit'

const OWNER_1_PRIVATE_KEY = ''
const OWNER_2_PRIVATE_KEY = ''
const OWNER_2_ADDRESS = ''

const RPC_URL = 'https://sepolia.gateway.tenderly.co'
const SAFE_ADDRESS = ''

async function addOwner() {
  const safeClient = await createSafeClient({
    provider: RPC_URL,
    signer: OWNER_1_PRIVATE_KEY,
    safeAddress: SAFE_ADDRESS
  })

  const transaction = await safeClient.createAddOwnerTransaction({
    ownerAddress: OWNER_2_ADDRESS,
    threshold: 2
  })

  const transactionResult = await safeClient.send({ transactions: [transaction] })

  console.log('Add Owner Transaction Result', transactionResult)
}

async function removeOwner() {
  const safeClient1 = await createSafeClient({
    provider: RPC_URL,
    signer: OWNER_1_PRIVATE_KEY,
    safeAddress: SAFE_ADDRESS
  })

  const safeClient2 = await createSafeClient({
    provider: RPC_URL,
    signer: OWNER_2_PRIVATE_KEY,
    safeAddress: SAFE_ADDRESS
  })

  const transaction = await safeClient1.createRemoveOwnerTransaction({
    ownerAddress: OWNER_2_ADDRESS,
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
    safeAddress: SAFE_ADDRESS
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
