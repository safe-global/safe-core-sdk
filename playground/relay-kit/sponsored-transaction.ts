import AccountAbstraction from '@safe-global/account-abstraction-kit-poc'
import { EthersAdapter } from '@safe-global/protocol-kit'
import { GelatoRelayPack } from '@safe-global/relay-kit'
import {
  MetaTransactionData,
  MetaTransactionOptions,
  OperationType
} from '@safe-global/safe-core-sdk-types'
import { ethers } from 'ethers'

// Fund the 1Balance account that will sponsor the transaction and get the API key:
// https://relay.gelato.network/

// Check the status of a transaction after it is relayed:
// https://relay.gelato.digital/tasks/status/<TASK_ID>

// Check the status of a transaction after it is executed:
// https://goerli.etherscan.io/tx/<TRANSACTION_HASH>

const config = {
  SAFE_SIGNER_PRIVATE_KEY: '<SAFE_SIGNER_PRIVATE_KEY>',
  RPC_URL: 'https://goerli.infura.io/v3/<INFURA_API_KEY>',
  RELAY_API_KEY: '<GELATO_RELAY_API_KEY>'
}

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

  // SDK Initialization

  const provider = new ethers.JsonRpcProvider(config.RPC_URL)
  const signer = new ethers.Wallet(config.SAFE_SIGNER_PRIVATE_KEY, provider)

  const safeAccountAbstraction = new AccountAbstraction(
    new EthersAdapter({
      ethers,
      signerOrProvider: signer
    })
  )

  await safeAccountAbstraction.init()

  safeAccountAbstraction.setRelayKit(
    new GelatoRelayPack({
      apiKey: config.RELAY_API_KEY,
      protocolKit: safeAccountAbstraction.protocolKit
    })
  )

  // Calculate Safe address

  const predictedSafeAddress = await safeAccountAbstraction.protocolKit.getAddress()
  console.log({ predictedSafeAddress })

  const isSafeDeployed = await safeAccountAbstraction.protocolKit.isSafeDeployed()
  console.log({ isSafeDeployed })

  // Fake on-ramp to fund the Safe

  const safeBalance = await provider.getBalance(predictedSafeAddress)
  console.log({ safeBalance: ethers.formatEther(safeBalance.toString()) })
  if (safeBalance < BigInt(txConfig.VALUE)) {
    const fakeOnRampSigner = new ethers.Wallet(mockOnRampConfig.PRIVATE_KEY, provider)
    const onRampResponse = await fakeOnRampSigner.sendTransaction({
      to: predictedSafeAddress,
      value: txConfig.VALUE
    })
    console.log(`Funding the Safe with ${ethers.formatEther(txConfig.VALUE.toString())} ETH`)
    await onRampResponse.wait()

    const safeBalanceAfter = await provider.getBalance(predictedSafeAddress)
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

  const response = await safeAccountAbstraction.relayTransaction(safeTransactions, options)
  console.log({ GelatoTaskId: response })
}

main()
