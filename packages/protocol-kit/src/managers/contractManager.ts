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
import { getSafeContractVersion } from '@safe-global/protocol-kit/contracts/utils'
import { detectSafeVersionFromMastercopy } from '../utils/mastercopyMatcher'

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
      let detectedVersion: SafeVersion | undefined
      let detectedIsL1: boolean | undefined

      try {
        // We try to fetch the version of the Safe from the blockchain
        safeVersion = await getSafeContractVersion(safeProvider, safeAddress as string)
      } catch (e) {
        // If contract is not deployed or VERSION() call fails, try mastercopy matching (L2 only)
        const mastercopyMatch = await detectSafeVersionFromMastercopy(
          safeProvider,
          safeAddress as string,
          chainId
        )

        if (mastercopyMatch) {
          // Successfully matched the mastercopy to a known L2 version
          detectedVersion = mastercopyMatch.version
          detectedIsL1 = mastercopyMatch.isL1
          safeVersion = detectedVersion
        } else {
          // If no match found, use the default version
          safeVersion = DEFAULT_SAFE_VERSION
        }
      }

      this.#safeContract = await getSafeContract({
        safeProvider,
        safeVersion,
        isL1SafeSingleton: detectedIsL1 ?? isL1SafeSingleton,
        customSafeAddress: safeAddress,
        customContracts
      })
    }

    this.#multiSendContract = await getMultiSendContract({
      safeProvider,
      safeVersion,
      customContracts,
      deploymentType: predictedSafe?.safeDeploymentConfig?.deploymentType
    })

    this.#multiSendCallOnlyContract = await getMultiSendCallOnlyContract({
      safeProvider,
      safeVersion,
      customContracts,
      deploymentType: predictedSafe?.safeDeploymentConfig?.deploymentType
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
