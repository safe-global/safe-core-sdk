import { Chain, createWalletClient, custom, formatEther, Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { getBalance, waitForTransactionReceipt } from 'viem/actions'
import { sepolia } from 'viem/chains'
import { createSafeClient, SafeClient } from '@safe-global/sdk-starter-kit'
import { GelatoRelayPack } from '@safe-global/relay-kit'
import {
  MetaTransactionData,
  MetaTransactionOptions,
  OperationType,
  SafeTransaction
} from '@safe-global/types-kit'

// Fund the 1Balance account that will sponsor the transaction and get the API key:
// https://relay.gelato.network/

// Check the status of a transaction after it is relayed:
// https://relay.gelato.digital/tasks/status/<TASK_ID>

// Check the status of a transaction after it is executed:
// https://sepolia.etherscan.io/tx/<TRANSACTION_HASH>

const config = {
  SAFE_SIGNER_PRIVATE_KEY: '<SAFE_SIGNER_PRIVATE_KEY>',
  SAFE_SIGNER_ADDRESS: '<SAFE_SIGNER_ADDRESS>',
  RELAY_API_KEY: '<GELATO_RELAY_API_KEY>'
}

const CHAIN: Chain = sepolia
const RPC_URL = CHAIN.rpcUrls.default.http[0]

const mockOnRampConfig = {
  ADDRESS: '<ADDRESS>',
  PRIVATE_KEY: '<PRIVATE_KEY>'
}

const txConfig = {
  TO: '<TO>',
  DATA: '<DATA>',
  VALUE: '<VALUE>'
}

async function main() {
  console.log('Execute meta-transaction via Gelato Relay paid by 1Balance')

  const safeClient = await createSafeClient({
    provider: RPC_URL,
    signer: config.SAFE_SIGNER_PRIVATE_KEY,
    safeOptions: {
      owners: [config.SAFE_SIGNER_ADDRESS],
      threshold: 1,
      saltNonce: '1'
    }
  })

  const gelatoSafeClient = safeClient.extend((client: SafeClient) => {
    const relayPack = new GelatoRelayPack({
      apiKey: config.RELAY_API_KEY,
      protocolKit: client.protocolKit
    })

    return {
      relayTransaction: async (
        transactions: MetaTransactionData[],
        options?: MetaTransactionOptions
      ) => {
        const relayedTransaction = (await relayPack.createTransaction({
          transactions,
          options
        })) as SafeTransaction

        const signedSafeTransaction = await client.protocolKit.signTransaction(relayedTransaction)

        return relayPack.executeTransaction({ executable: signedSafeTransaction, options })
      }
    }
  })

  // Calculate Safe address

  const predictedSafeAddress = await gelatoSafeClient.protocolKit.getAddress()
  console.log({ predictedSafeAddress })

  const isSafeDeployed = await gelatoSafeClient.protocolKit.isSafeDeployed()
  console.log({ isSafeDeployed })

  // Fake on-ramp to fund the Safe

  const externalProvider = gelatoSafeClient.protocolKit.getSafeProvider().getExternalProvider()
  const safeBalance = await getBalance(externalProvider, { address: predictedSafeAddress })
  console.log({ safeBalance: formatEther(safeBalance) })
  if (safeBalance < BigInt(txConfig.VALUE)) {
    const fakeOnRampSigner = createWalletClient({
      account: privateKeyToAccount(mockOnRampConfig.PRIVATE_KEY as Hex),
      transport: custom(externalProvider),
      chain: CHAIN
    })
    const hash = await fakeOnRampSigner.sendTransaction({
      to: predictedSafeAddress,
      value: BigInt(txConfig.VALUE)
    })
    console.log(`Funding the Safe with ${formatEther(BigInt(txConfig.VALUE))} ETH`)
    await waitForTransactionReceipt(externalProvider, { hash })

    const safeBalanceAfter = await getBalance(externalProvider, { address: predictedSafeAddress })
    console.log({ safeBalance: formatEther(safeBalanceAfter) })
  }

  // Relay the transaction

  const safeTransactions: MetaTransactionData[] = [
    {
      to: txConfig.TO,
      data: txConfig.DATA,
      value: txConfig.VALUE,
      operation: OperationType.Call
    }
  ]
  const options: MetaTransactionOptions = {
    isSponsored: true
  }

  const response = await gelatoSafeClient.relayTransaction(safeTransactions, options)
  console.log({ GelatoTaskId: response })
  console.log(
    `Check the status of the transaction at https://relay.gelato.digital/tasks/status/${response.taskId}`
  )
}

main()
