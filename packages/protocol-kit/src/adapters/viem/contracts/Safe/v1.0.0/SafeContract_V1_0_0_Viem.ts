import { Gnosis_safe__factory as Safe__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.0.0'
import {
  SafeSetupConfig,
  TransactionOptions,
  TransactionResult
} from '@safe-global/safe-core-sdk-types'
import { Address, Hash, isAddressEqual } from 'viem'
import SafeContractViem, { SafeContractViemBaseArgs } from '../SafeContractViem'
import { EMPTY_DATA, ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'

class SafeContract_V1_0_0_Viem extends SafeContractViem {
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
        paymentToken as Address,
        BigInt(payment),
        paymentReceiver as Address
      ],
      this.formatViemTransactionOptions(options ?? {})
    )

    return this.formatTransactionResult(txHash, options)
  }

  async getModules() {
    return this.contract.read.getModules().then((res) => res as Address[])
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    const modules = await this.getModules()
    const isModuleEnabled = modules.some((enabledModuleAddress: Address) =>
      isAddressEqual(enabledModuleAddress, moduleAddress as Address)
    )
    return isModuleEnabled
  }
}

export default SafeContract_V1_0_0_Viem
