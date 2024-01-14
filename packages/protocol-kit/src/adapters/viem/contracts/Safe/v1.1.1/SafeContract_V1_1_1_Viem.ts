import { EMPTY_DATA, ZERO_ADDRESS } from '@safe-global/protocol-kit/adapters/ethers/utils/constants'
import { Gnosis_safe__factory as Safe__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.1.1'
import {
  SafeSetupConfig,
  TransactionOptions,
  TransactionResult
} from '@safe-global/safe-core-sdk-types'
import SafeContractViem from '../SafeContractViem'
import { Address, Hash, isAddressEqual } from 'viem'
import { ViemContractBaseArgs } from '../../../ViemContract'

class SafeContract_V1_1_1_Viem extends SafeContractViem {
  constructor(args: ViemContractBaseArgs) {
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

    return this.writeContract(
      'setup',
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
      options
    )
  }

  async getModules(): Promise<Address[]> {
    return this.readContract('getModules').then((res) => res as Address[])
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    const modules = await this.getModules()
    const isModuleEnabled = modules.some((enabledModuleAddress: Address) =>
      isAddressEqual(enabledModuleAddress, moduleAddress as Address)
    )
    return isModuleEnabled
  }
}

export default SafeContract_V1_1_1_Viem
