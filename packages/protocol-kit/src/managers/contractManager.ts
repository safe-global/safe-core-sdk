import { DEFAULT_SAFE_VERSION } from '@safe-global/protocol-kit/contracts/config'
import {
  getMultiSendCallOnlyContract,
  getMultiSendContract,
  getSafeContract
} from '@safe-global/protocol-kit/contracts/safeDeploymentContracts'
import { ContractNetworksConfig, SafeConfig } from '@safe-global/protocol-kit/types'
import {
  MultiSendCallOnlyContract,
  MultiSendContract,
  SafeContract
} from '@safe-global/safe-core-sdk-types'
import { SafeVersion } from 'packages/safe-core-sdk-types/dist/src/types'
import { isSafeConfigWithPredictedSafe } from '../utils/types'

class ContractManager {
  #contractNetworks?: ContractNetworksConfig
  #isL1SafeSingleton?: boolean
  #safeContract?: SafeContract
  #multiSendContract!: MultiSendContract
  #multiSendCallOnlyContract!: MultiSendCallOnlyContract

  static async create(config: SafeConfig): Promise<ContractManager> {
    const contractManager = new ContractManager()
    await contractManager.init(config)
    return contractManager
  }

  async init(config: SafeConfig): Promise<void> {
    const { ethAdapter, isL1SafeSingleton, contractNetworks, predictedSafe, safeAddress } = config

    const chainId = await ethAdapter.getChainId()
    const customContracts = contractNetworks?.[chainId.toString()]
    this.#contractNetworks = contractNetworks
    this.#isL1SafeSingleton = isL1SafeSingleton

    let safeVersion: SafeVersion

    if (isSafeConfigWithPredictedSafe(config)) {
      safeVersion = predictedSafe?.safeDeploymentConfig?.safeVersion ?? DEFAULT_SAFE_VERSION
    } else {
      // We use the default version of the Safe contract to get the correct version of this Safe
      const defaultSafeContractInstance = await getSafeContract({
        ethAdapter,
        safeVersion: DEFAULT_SAFE_VERSION,
        isL1SafeSingleton,
        customSafeAddress: safeAddress,
        customContracts
      })

      // We check the correct version of the Safe from the blockchain
      safeVersion = await defaultSafeContractInstance.getVersion()

      // We get the correct Safe Contract if the real Safe version is not the lastest
      const isTheDefaultSafeVersion = safeVersion === DEFAULT_SAFE_VERSION

      this.#safeContract = isTheDefaultSafeVersion
        ? defaultSafeContractInstance
        : await getSafeContract({
            ethAdapter,
            safeVersion,
            isL1SafeSingleton,
            customSafeAddress: safeAddress,
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

  get isL1SafeSingleton(): boolean | undefined {
    return this.#isL1SafeSingleton
  }

  get safeContract(): SafeContract | undefined {
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
