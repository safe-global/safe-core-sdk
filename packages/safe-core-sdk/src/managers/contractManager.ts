import { SafeVersion, SAFE_BASE_VERSION } from '../contracts/config'
import GnosisSafeContract from '../contracts/GnosisSafe/GnosisSafeContract'
import MultiSendContract from '../contracts/MultiSend/MultiSendContract'
import { SafeConfig } from '../Safe'
import { ContractNetworksConfig } from '../types'

class ContractManager {
  #contractNetworks?: ContractNetworksConfig
  #isL1SafeMasterCopy?: boolean
  #safeContract!: GnosisSafeContract
  #multiSendContract!: MultiSendContract

  static async create({
    ethAdapter,
    safeAddress,
    isL1SafeMasterCopy,
    contractNetworks
  }: SafeConfig): Promise<ContractManager> {
    const contractManager = new ContractManager()
    await contractManager.init({ ethAdapter, safeAddress, isL1SafeMasterCopy, contractNetworks })
    return contractManager
  }

  async init({
    ethAdapter,
    safeAddress,
    isL1SafeMasterCopy,
    contractNetworks
  }: SafeConfig): Promise<void> {
    const chainId = await ethAdapter.getChainId()
    const temporarySafeContract = await ethAdapter.getSafeContract({
      safeVersion: SAFE_BASE_VERSION,
      chainId,
      isL1SafeMasterCopy,
      customContractAddress: safeAddress
    })
    const safeVersion = (await temporarySafeContract.getVersion()) as SafeVersion

    const customContracts = contractNetworks?.[chainId]
    this.#contractNetworks = contractNetworks
    this.#isL1SafeMasterCopy = isL1SafeMasterCopy
    this.#safeContract = await ethAdapter.getSafeContract({
      safeVersion,
      chainId,
      isL1SafeMasterCopy,
      customContractAddress: safeAddress
    })
    this.#multiSendContract = await ethAdapter.getMultiSendContract(
      safeVersion,
      chainId,
      customContracts?.multiSendAddress
    )
  }

  get contractNetworks(): ContractNetworksConfig | undefined {
    return this.#contractNetworks
  }

  get isL1SafeMasterCopy(): boolean | undefined {
    return this.#isL1SafeMasterCopy
  }

  get safeContract(): GnosisSafeContract {
    return this.#safeContract
  }

  get multiSendContract(): MultiSendContract {
    return this.#multiSendContract
  }
}

export default ContractManager
