import {
  EthersTransactionOptions,
  EthersTransactionResult
} from '@safe-global/protocol-kit/adapters/ethers/types'
import { toTxResult } from '@safe-global/protocol-kit/adapters/ethers/utils'
import { EMPTY_DATA, ZERO_ADDRESS } from '@safe-global/protocol-kit/adapters/ethers/utils/constants'
import { Gnosis_safe as Safe } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.2.0/Gnosis_safe'
import { SafeSetupConfig } from '@safe-global/safe-core-sdk-types'
import SafeContractEthers from '../SafeContractEthers'

class SafeContract_V1_2_0_Ethers extends SafeContractEthers {
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
      fallbackHandler = ZERO_ADDRESS,
      paymentToken = ZERO_ADDRESS,
      payment = 0,
      paymentReceiver = ZERO_ADDRESS
    } = setupConfig

    if (options && !options.gasLimit) {
      options.gasLimit = await this.estimateGas(
        'setup',
        [owners, threshold, to, data, fallbackHandler, paymentToken, payment, paymentReceiver],
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
      fallbackHandler,
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
    return this.contract.isModuleEnabled(moduleAddress)
  }
}

export default SafeContract_V1_2_0_Ethers
