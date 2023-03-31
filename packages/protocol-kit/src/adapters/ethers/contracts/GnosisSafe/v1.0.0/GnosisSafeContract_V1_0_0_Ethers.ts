import { SafeSetupConfig } from '@safe-global/safe-core-sdk-types'
import {
  EthersTransactionOptions,
  EthersTransactionResult
} from '@safe-global/protocol-kit/adapters/ethers/types'
import { ZERO_ADDRESS, EMPTY_DATA } from '@safe-global/protocol-kit/adapters/ethers/utils/constants'
import { Gnosis_safe as GnosisSafe } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.0.0/Gnosis_safe'
import { sameString, toTxResult } from '@safe-global/protocol-kit/adapters/ethers/utils'
import GnosisSafeContractEthers from '../GnosisSafeContractEthers'

class GnosisSafeContract_V1_0_0_Ethers extends GnosisSafeContractEthers {
  constructor(public contract: GnosisSafe) {
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
      options
    )

    return toTxResult(txResponse, options)
  }

  async getModules(): Promise<string[]> {
    return this.contract.getModules()
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    const modules = await this.getModules()
    const isModuleEnabled = modules.some((enabledModuleAddress: string) =>
      sameString(enabledModuleAddress, moduleAddress)
    )
    return isModuleEnabled
  }
}

export default GnosisSafeContract_V1_0_0_Ethers
