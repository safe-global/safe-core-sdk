import AccountAbstraction from '@safe-global/account-abstraction-kit-poc'
import { GelatoRelayPack } from '@safe-global/relay-kit'
import {
  MetaTransactionData,
  MetaTransactionOptions,
  OperationType
} from '@safe-global/safe-core-sdk-types'
import { ethers } from 'ethers'

// Check the status of a transaction after it is relayed:
// https://relay.gelato.digital/tasks/status/<TASK_ID>

// Check the status of a transaction after it is executed:
// https://sepolia.etherscan.io/tx/<TRANSACTION_HASH>

const config = {
  SAFE_SIGNER_PRIVATE_KEY: '<SAFE_SIGNER_PRIVATE_KEY>'
}

const RPC_URL = 'https://sepolia.gateway.tenderly.co'

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

  // SDK Initialization

  const safeAccountAbstraction = new AccountAbstraction({
    provider: RPC_URL,
    signer: config.SAFE_SIGNER_PRIVATE_KEY
  })

  await safeAccountAbstraction.init()

  const relayPack = new GelatoRelayPack({ protocolKit: safeAccountAbstraction.protocolKit })

  safeAccountAbstraction.setRelayKit(relayPack)

  // Calculate Safe address

  const predictedSafeAddress = await safeAccountAbstraction.protocolKit.getAddress()
  console.log({ predictedSafeAddress })

  const isSafeDeployed = await safeAccountAbstraction.protocolKit.isSafeDeployed()
  console.log({ isSafeDeployed })

  const ethersProvider = safeAccountAbstraction.protocolKit.getSafeProvider().getExternalProvider()

  // Fake on-ramp to transfer enough funds to the Safe address

  const chainId = (await ethersProvider.getNetwork()).chainId
  const relayFee = BigInt(
    await relayPack.getEstimateFee(chainId, txConfig.GAS_LIMIT, txConfig.GAS_TOKEN)
  )
  const safeBalance = await ethersProvider.getBalance(predictedSafeAddress)
  console.log({ minSafeBalance: ethers.formatEther(relayFee.toString()) })
  console.log({ safeBalance: ethers.formatEther(safeBalance.toString()) })

  if (safeBalance < relayFee) {
    const fakeOnRampSigner = new ethers.Wallet(mockOnRampConfig.PRIVATE_KEY, ethersProvider)
    const fundingAmount = safeBalance < relayFee ? relayFee - safeBalance : safeBalance - relayFee
    const onRampResponse = await fakeOnRampSigner.sendTransaction({
      to: predictedSafeAddress,
      value: fundingAmount
    })
    console.log(`Funding the Safe with ${ethers.formatEther(fundingAmount.toString())} ETH`)
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
    gasLimit: txConfig.GAS_LIMIT,
    gasToken: txConfig.GAS_TOKEN
  }

  const response = await safeAccountAbstraction.relayTransaction(safeTransactions, options)
  console.log({ GelatoTaskId: response })
}

main()
