import { EMPTY_DATA, ZERO_ADDRESS } from '@safe-global/protocol-kit/adapters/ethers/utils/constants'
import { Gnosis_safe__factory as Safe__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.2.0'
import {
  SafeSetupConfig,
  TransactionOptions,
  TransactionResult
} from '@safe-global/safe-core-sdk-types'
import SafeContractViem, { SafeContractViemBaseArgs } from '../SafeContractViem'
import { Address, Hash } from 'viem'

class SafeContract_V1_2_0_Viem extends SafeContractViem {
  constructor(args: SafeContractViemBaseArgs) {
    super({ ...args, abi: Safe__factory.abi })
  }

  async setup(
    setupConfig: SafeSetupConfig,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    const {
      owners,
      threshold,
      to = ZERO_ADDRESS,
      data = EMPTY_DATA,
      fallbackHandler = ZERO_ADDRESS,
      paymentToken = ZERO_ADDRESS,
      payment = 0,
      paymentReceiver = ZERO_ADDRESS
    } = setupConfig

    const txHash = await this.contract.write.setup(
      [
        owners as Address[],
        BigInt(threshold),
        to as Address,
        data as Hash,
        fallbackHandler as Hash,
        paymentToken as Address,
        BigInt(payment),
        paymentReceiver as Address
      ],
      this.formatViemTransactionOptions(options ?? {})
    )

    return this.formatTransactionResult(txHash, options)
  }

  async getModules(): Promise<string[]> {
    return this.contract.read.getModules().then((res) => res as string[])
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    return this.contract.read.isModuleEnabled([moduleAddress as Address])
  }
}

export default SafeContract_V1_2_0_Viem
