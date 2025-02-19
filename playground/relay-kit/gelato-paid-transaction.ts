import { Chain, formatEther, createWalletClient, custom, Hex } from 'viem'
import { sepolia } from 'viem/chains'
import { getBalance, waitForTransactionReceipt } from 'viem/actions'
import { privateKeyToAccount } from 'viem/accounts'
import { createSafeClient, SafeClient } from '@safe-global/sdk-starter-kit'
import { GelatoRelayPack } from '@safe-global/relay-kit'
import {
  MetaTransactionData,
  MetaTransactionOptions,
  OperationType,
  SafeTransaction
} from '@safe-global/types-kit'

// Check the status of a transaction after it is relayed:
// https://relay.gelato.digital/tasks/status/<TASK_ID>

// Check the status of a transaction after it is executed:
// https://sepolia.etherscan.io/tx/<TRANSACTION_HASH>

const config = {
  SAFE_SIGNER_PRIVATE_KEY: '<SAFE_SIGNER_PRIVATE_KEY>',
  SAFE_SIGNER_ADDRESS: '<SAFE_SIGNER_ADDRESS>'
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
  VALUE: '<VALUE>',
  // Options:
  GAS_LIMIT: '<GAS_LIMIT>',
  GAS_TOKEN: '0x0000000000000000000000000000000000000000'
}

async function main() {
  console.log('Execute meta-transaction via Gelato Relay paid with balance in the Safe')

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
    const relayPack = new GelatoRelayPack({ protocolKit: client.protocolKit })

    return {
      getEstimateFee: async (chainId: bigint, gasLimit: string, gasToken: string) => {
        return await relayPack.getEstimateFee(chainId, gasLimit, gasToken)
      },
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

  const externalProvider = gelatoSafeClient.protocolKit.getSafeProvider().getExternalProvider()

  // Fake on-ramp to transfer enough funds to the Safe address

  const chainId = await externalProvider.getChainId()
  const relayFee = BigInt(
    await gelatoSafeClient.getEstimateFee(BigInt(chainId), txConfig.GAS_LIMIT, txConfig.GAS_TOKEN)
  )
  const safeBalance = await getBalance(externalProvider, { address: predictedSafeAddress })
  console.log({ minSafeBalance: formatEther(relayFee) })
  console.log({ safeBalance: formatEther(safeBalance) })

  if (safeBalance < relayFee) {
    const fakeOnRampSigner = createWalletClient({
      account: privateKeyToAccount(mockOnRampConfig.PRIVATE_KEY as Hex),
      transport: custom(externalProvider),
      chain: CHAIN
    })

    const fundingAmount = safeBalance < relayFee ? relayFee - safeBalance : safeBalance - relayFee
    const hash = await fakeOnRampSigner.sendTransaction({
      to: predictedSafeAddress,
      value: fundingAmount,
      account: fakeOnRampSigner.account
    })
    console.log(`Funding the Safe with ${formatEther(fundingAmount)} ETH`)

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
    gasLimit: txConfig.GAS_LIMIT,
    gasToken: txConfig.GAS_TOKEN
  }

  const response = await gelatoSafeClient.relayTransaction(safeTransactions, options)
  console.log({ GelatoTaskId: response })
  console.log(
    `Check the status of the transaction at https://relay.gelato.digital/tasks/status/${response.taskId}`
  )
}

main()
