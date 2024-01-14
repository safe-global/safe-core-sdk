import {
  EMPTY_DATA,
  SENTINEL_ADDRESS,
  ZERO_ADDRESS
} from '@safe-global/protocol-kit/adapters/ethers/utils/constants'
import { Gnosis_safe__factory as Safe__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.3.0'
import {
  SafeSetupConfig,
  TransactionOptions,
  TransactionResult
} from '@safe-global/safe-core-sdk-types'
import SafeContractViem from '../SafeContractViem'
import { Address, Hash } from 'viem'
import { ViemContractBaseArgs } from '../../../ViemContract'

class SafeContract_V1_3_0_Viem extends SafeContractViem {
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
    const [array] = await this.readContract('getModulesPaginated', [SENTINEL_ADDRESS, 10n])
    return array as Address[]
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    return this.readContract('isModuleEnabled', [moduleAddress as Address])
  }
}

export default SafeContract_V1_3_0_Viem
