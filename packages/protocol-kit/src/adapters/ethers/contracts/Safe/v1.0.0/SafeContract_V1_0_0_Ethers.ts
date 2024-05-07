import {
  EthersTransactionOptions,
  EthersTransactionResult
} from '@safe-global/protocol-kit/adapters/ethers/types'
import { sameString, toTxResult } from '@safe-global/protocol-kit/adapters/ethers/utils'
import { EMPTY_DATA, ZERO_ADDRESS } from '@safe-global/protocol-kit/adapters/ethers/utils/constants'
import { Gnosis_safe as Safe } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.0.0/Gnosis_safe'
import { SafeSetupConfig } from '@safe-global/safe-core-sdk-types'
import SafeContractEthers from '../SafeContractEthers'
import { SENTINEL_ADDRESS } from '@safe-global/protocol-kit/utils/constants'

class SafeContract_V1_0_0_Ethers extends SafeContractEthers {
  constructor(public contract: Safe) {
    super(contract)
  }

  async setup(
    setupConfig: SafeSetupConfig,
    options?: EthersTransactionOptions
  ): Promise<EthersTransactionResult> {
    const {
      owners,
      threshold,
      to = ZERO_ADDRESS,
      data = EMPTY_DATA,
      paymentToken = ZERO_ADDRESS,
      payment = 0,
      paymentReceiver = ZERO_ADDRESS
    } = setupConfig

    if (options && !options.gasLimit) {
      options.gasLimit = await this.estimateGas(
        'setup',
        [owners, threshold, to, data, paymentToken, payment, paymentReceiver],
        {
          ...options
        }
      )
    }
    const txResponse = await this.contract.setup(
      owners,
      threshold,
      to,
      data,
      paymentToken,
      payment,
      paymentReceiver,
      { ...options }
    )

    return toTxResult(txResponse, options)
  }

  async getModules(): Promise<string[]> {
    return this.contract.getModules()
  }

  async getModulesPaginated(start: string, pageSize: number): Promise<string[]> {
    if (pageSize <= 0) throw new Error('Invalid page size for fetching paginated modules')

    const array = await this.getModules()
    if (start === SENTINEL_ADDRESS) {
      return array.slice(0, pageSize)
    } else {
      const moduleIndex = array.findIndex((module: string) => sameString(module, start))
      return moduleIndex === -1 ? [] : array.slice(moduleIndex + 1, pageSize)
    }
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    const modules = await this.getModules()
    const isModuleEnabled = modules.some((enabledModuleAddress: string) =>
      sameString(enabledModuleAddress, moduleAddress)
    )
    return isModuleEnabled
  }
}

export default SafeContract_V1_0_0_Ethers
