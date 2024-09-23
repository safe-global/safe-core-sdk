import { DEFAULT_SAFE_VERSION } from '@safe-global/protocol-kit/contracts/config'
import {
  getMultiSendCallOnlyContract,
  getMultiSendContract,
  getSafeContract
} from '@safe-global/protocol-kit/contracts/safeDeploymentContracts'
import {
  ContractNetworksConfig,
  MultiSendCallOnlyContractImplementationType,
  MultiSendContractImplementationType,
  SafeConfig,
  SafeContractImplementationType
} from '@safe-global/protocol-kit/types'
import { SafeVersion } from '@safe-global/types-kit'
import { isSafeConfigWithPredictedSafe } from '../utils/types'
import SafeProvider from '../SafeProvider'
import { parseAbi } from 'viem'

class ContractManager {
  #contractNetworks?: ContractNetworksConfig
  #isL1SafeSingleton?: boolean
  #safeContract?: SafeContractImplementationType
  #multiSendContract!: MultiSendContractImplementationType
  #multiSendCallOnlyContract!: MultiSendCallOnlyContractImplementationType

  static async init(config: SafeConfig, safeProvider: SafeProvider): Promise<ContractManager> {
    const contractManager = new ContractManager()
    await contractManager.#initializeContractManager(config, safeProvider)
    return contractManager
  }

  async #initializeContractManager(config: SafeConfig, safeProvider: SafeProvider) {
    const { isL1SafeSingleton, contractNetworks, predictedSafe, safeAddress } = config

    const chainId = await safeProvider.getChainId()
    const customContracts = contractNetworks?.[chainId.toString()]
    this.#contractNetworks = contractNetworks
    this.#isL1SafeSingleton = isL1SafeSingleton

    let safeVersion: SafeVersion

    if (isSafeConfigWithPredictedSafe(config)) {
      safeVersion = predictedSafe?.safeDeploymentConfig?.safeVersion ?? DEFAULT_SAFE_VERSION
    } else {
      // We check the correct version of the Safe from the blockchain
      safeVersion = (await safeProvider.getExternalProvider().readContract({
        address: safeAddress as string,
        abi: parseAbi(['function VERSION() view returns (string)']),
        functionName: 'VERSION'
      })) as SafeVersion

      this.#safeContract = await getSafeContract({
        safeProvider,
        safeVersion,
        isL1SafeSingleton,
        customSafeAddress: safeAddress,
        customContracts
      })
    }

    this.#multiSendContract = await getMultiSendContract({
      safeProvider,
      safeVersion,
      customContracts
    })

    this.#multiSendCallOnlyContract = await getMultiSendCallOnlyContract({
      safeProvider,
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

  get safeContract(): SafeContractImplementationType | undefined {
    return this.#safeContract
  }

  get multiSendContract(): MultiSendContractImplementationType {
    return this.#multiSendContract
  }

  get multiSendCallOnlyContract(): MultiSendCallOnlyContractImplementationType {
    return this.#multiSendCallOnlyContract
  }
}

export default ContractManager
