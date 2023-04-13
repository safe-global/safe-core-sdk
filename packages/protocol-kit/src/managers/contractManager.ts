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

class ContractManager {
  #contractNetworks?: ContractNetworksConfig
  #isL1SafeMasterCopy?: boolean
  #safeContract?: GnosisSafeContract
  #multiSendContract!: MultiSendContract
  #multiSendCallOnlyContract!: MultiSendCallOnlyContract

  static async create({
    ethAdapter,
    safeAddress,
    predictedSafe,
    isL1SafeMasterCopy,
    contractNetworks
  }: SafeConfig): Promise<ContractManager> {
    const contractManager = new ContractManager()
    await contractManager.init({
      ethAdapter,
      safeAddress,
      predictedSafe,
      isL1SafeMasterCopy,
      contractNetworks
    })
    return contractManager
  }

  async init({
    ethAdapter,
    safeAddress,
    isL1SafeMasterCopy,
    contractNetworks
  }: SafeConfig): Promise<void> {
    const chainId = await ethAdapter.getChainId()
    const customContracts = contractNetworks?.[chainId]
    this.#contractNetworks = contractNetworks
    this.#isL1SafeMasterCopy = isL1SafeMasterCopy

    let safeVersion = SAFE_LAST_VERSION
    if (safeAddress) {
      const temporarySafeContract = await getSafeContract({
        ethAdapter,
        safeVersion,
        chainId,
        isL1SafeMasterCopy,
        customSafeAddress: safeAddress,
        customContracts
      })
      safeVersion = await temporarySafeContract.getVersion()
      this.#safeContract = await getSafeContract({
        ethAdapter,
        safeVersion,
        chainId,
        isL1SafeMasterCopy,
        customSafeAddress: safeAddress,
        customContracts
      })
    }

    this.#multiSendContract = await getMultiSendContract({
      ethAdapter,
      safeVersion,
      chainId,
      customContracts
    })
    this.#multiSendCallOnlyContract = await getMultiSendCallOnlyContract({
      ethAdapter,
      safeVersion,
      chainId,
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
