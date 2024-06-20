import { createSafeClient, SafeClient } from '@safe-global/safe-kit'
import { GelatoRelayPack } from '@safe-global/relay-kit'
import {
  MetaTransactionData,
  MetaTransactionOptions,
  OperationType,
  SafeTransaction
} from '@safe-global/safe-core-sdk-types'
import { ethers } from 'ethers'

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

const RPC_URL = 'https://sepolia.gateway.tenderly.co'

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

  const ethersProvider = gelatoSafeClient.protocolKit.getSafeProvider().getExternalProvider()
  const safeBalance = await ethersProvider.getBalance(predictedSafeAddress)
  console.log({ safeBalance: ethers.formatEther(safeBalance.toString()) })
  if (safeBalance < BigInt(txConfig.VALUE)) {
    const fakeOnRampSigner = new ethers.Wallet(mockOnRampConfig.PRIVATE_KEY, ethersProvider)
    const onRampResponse = await fakeOnRampSigner.sendTransaction({
      to: predictedSafeAddress,
      value: txConfig.VALUE
    })
    console.log(`Funding the Safe with ${ethers.formatEther(txConfig.VALUE.toString())} ETH`)
    await onRampResponse.wait()

    const safeBalanceAfter = await ethersProvider.getBalance(predictedSafeAddress)
    console.log({ safeBalance: ethers.formatEther(safeBalanceAfter.toString()) })
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
}

main()
