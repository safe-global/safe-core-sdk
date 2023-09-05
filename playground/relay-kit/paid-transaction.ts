import AccountAbstraction, {
  AccountAbstractionConfig
} from '@safe-global/account-abstraction-kit-poc'
import { GelatoRelayPack } from '@safe-global/relay-kit'
import {
  MetaTransactionData,
  MetaTransactionOptions,
  OperationType
} from '@safe-global/safe-core-sdk-types'
import { BigNumber, ethers } from 'ethers'

// Check the status of a transaction after it is relayed:
// https://relay.gelato.digital/tasks/status/<TASK_ID>

// Check the status of a transaction after it is executed:
// https://goerli.etherscan.io/tx/<TRANSACTION_HASH>

const config = {
  SAFE_SIGNER_PRIVATE_KEY: '<SAFE_SIGNER_PRIVATE_KEY>',
  RPC_URL: 'https://goerli.infura.io/v3/<INFURA_API_KEY>'
}

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
  GAS_TOKEN: ethers.constants.AddressZero
}

async function main() {
  console.log('Execute meta-transaction via Gelato Relay paid with balance in the Safe')

  // SDK Initialization

  const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL)
  const signer = new ethers.Wallet(config.SAFE_SIGNER_PRIVATE_KEY, provider)

  const relayPack = new GelatoRelayPack()

  const safeAccountAbstraction = new AccountAbstraction(signer)
  const sdkConfig: AccountAbstractionConfig = {
    relayPack
  }
  await safeAccountAbstraction.init(sdkConfig)

  // Calculate Safe address

  const predictedSafeAddress = safeAccountAbstraction.getSafeAddress()
  console.log({ predictedSafeAddress })

  const isSafeDeployed = await safeAccountAbstraction.isSafeDeployed()
  console.log({ isSafeDeployed })

  // Fake on-ramp to transfer enough funds to the Safe address

  const chainId = (await signer.provider.getNetwork()).chainId
  const relayFee = await relayPack.getEstimateFee(chainId, txConfig.GAS_LIMIT, txConfig.GAS_TOKEN)
  const safeBalance = await provider.getBalance(predictedSafeAddress)
  console.log({ minSafeBalance: ethers.utils.formatEther(relayFee.toString()) })
  console.log({ safeBalance: ethers.utils.formatEther(safeBalance.toString()) })

  if (safeBalance.lt(relayFee)) {
    const fakeOnRampSigner = new ethers.Wallet(mockOnRampConfig.PRIVATE_KEY, provider)
    const fundingAmount = safeBalance.lt(relayFee)
      ? BigNumber.from(relayFee).sub(safeBalance)
      : safeBalance.sub(relayFee)
    const onRampResponse = await fakeOnRampSigner.sendTransaction({
      to: predictedSafeAddress,
      value: fundingAmount
    })
    console.log(`Funding the Safe with ${ethers.utils.formatEther(fundingAmount.toString())} ETH`)
    await onRampResponse.wait()

    const safeBalanceAfter = await provider.getBalance(predictedSafeAddress)
    console.log({ safeBalance: ethers.utils.formatEther(safeBalanceAfter.toString()) })
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
