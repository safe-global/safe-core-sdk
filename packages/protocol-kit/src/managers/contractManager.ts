import { SAFE_LAST_VERSION } from '@safe-global/protocol-kit/contracts/config'
import {
  getMultiSendCallOnlyContract,
  getMultiSendContract,
  getSafeContract
} from '@safe-global/protocol-kit/contracts/safeDeploymentContracts'
import { ContractNetworksConfig, SafeConfig } from '@safe-global/protocol-kit/types'
import {
  GnosisSafeContract,
  MultiSendCallOnlyContract,
  MultiSendContract
} from '@safe-global/safe-core-sdk-types'
import { SafeVersion } from 'packages/safe-core-sdk-types/dist/src/types'
import { isSafeConfigWithPredictedSafe } from '../utils/types'

class ContractManager {
  #contractNetworks?: ContractNetworksConfig
  #isL1SafeMasterCopy?: boolean
  #safeContract?: GnosisSafeContract
  #multiSendContract!: MultiSendContract
  #multiSendCallOnlyContract!: MultiSendCallOnlyContract

  static async create(config: SafeConfig): Promise<ContractManager> {
    const contractManager = new ContractManager()
    await contractManager.init(config)
    return contractManager
  }

  async init(config: SafeConfig): Promise<void> {
    const { ethAdapter, isL1SafeMasterCopy, contractNetworks } = config

    const chainId = await ethAdapter.getChainId()
    const customContracts = contractNetworks?.[chainId]
    this.#contractNetworks = contractNetworks
    this.#isL1SafeMasterCopy = isL1SafeMasterCopy

    let safeVersion: SafeVersion

    if (isSafeConfigWithPredictedSafe(config)) {
      safeVersion = config.predictedSafe.safeDeploymentConfig.safeVersion ?? SAFE_LAST_VERSION
    } else {
      const temporarySafeContract = await getSafeContract({
        ethAdapter,
        safeVersion: SAFE_LAST_VERSION,
        isL1SafeMasterCopy,
        customSafeAddress: config.safeAddress,
        customContracts
      })
      safeVersion = await temporarySafeContract.getVersion()
      this.#safeContract = await getSafeContract({
        ethAdapter,
        safeVersion,
        isL1SafeMasterCopy,
        customSafeAddress: config.safeAddress,
        customContracts
      })
    }

    this.#multiSendContract = await getMultiSendContract({
      ethAdapter,
      safeVersion,
      customContracts
    })
    this.#multiSendCallOnlyContract = await getMultiSendCallOnlyContract({
      ethAdapter,
      safeVersion,
      customContracts
    })
  }

  get contractNetworks(): ContractNetworksConfig | undefined {
    return this.#contractNetworks
  }

  get isL1SafeMasterCopy(): boolean | undefined {
    return this.#isL1SafeMasterCopy
  }

  get safeContract(): GnosisSafeContract | undefined {
    return this.#safeContract
  }

  get multiSendContract(): MultiSendContract {
    return this.#multiSendContract
  }

  get multiSendCallOnlyContract(): MultiSendCallOnlyContract {
    return this.#multiSendCallOnlyContract
  }
}

export default ContractManager
