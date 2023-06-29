import {
  Web3TransactionOptions,
  Web3TransactionResult
} from '@safe-global/protocol-kit/adapters/web3/types'
import { toTxResult } from '@safe-global/protocol-kit/adapters/web3/utils'
import {
  EMPTY_DATA,
  SENTINEL_ADDRESS,
  ZERO_ADDRESS
} from '@safe-global/protocol-kit/adapters/web3/utils/constants'
import { Gnosis_safe as Safe } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Gnosis_safe'
import { SafeSetupConfig } from '@safe-global/safe-core-sdk-types'
import SafeContractWeb3 from '../SafeContractWeb3'

class SafeContract_V1_3_0_Web3 extends SafeContractWeb3 {
  constructor(public contract: Safe) {
    super(contract)
  }

  async setup(
    setupConfig: SafeSetupConfig,
    options?: Web3TransactionOptions
  ): Promise<Web3TransactionResult> {
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

    if (options && !options.gas) {
      options.gas = await this.estimateGas(
        'setup',
        [owners, threshold, to, data, fallbackHandler, paymentToken, payment, paymentReceiver],
        {
          ...options
        }
      )
    }
    const txResponse = this.contract.methods
      .setup(owners, threshold, to, data, fallbackHandler, paymentToken, payment, paymentReceiver)
      .send(options)

    return toTxResult(txResponse, options)
  }

  async getModules(): Promise<string[]> {
    const { array } = await this.contract.methods.getModulesPaginated(SENTINEL_ADDRESS, 10).call()
    return array
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    return this.contract.methods.isModuleEnabled(moduleAddress).call()
  }
}

export default SafeContract_V1_3_0_Web3
