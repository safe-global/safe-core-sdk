import GnosisSafeContract from '../contracts/GnosisSafe/GnosisSafeContract'
import MultiSendContract from '../contracts/MultiSend/MultiSendContract'
import EthAdapter from '../ethereumLibs/EthAdapter'
import { ContractNetworksConfig } from '../types'

class ContractManager {
  #contractNetworks?: ContractNetworksConfig
  #safeContract!: GnosisSafeContract
  #multiSendContract!: MultiSendContract

  static async create(
    ethAdapter: EthAdapter,
    safeAddress: string,
    contractNetworks?: ContractNetworksConfig
  ): Promise<ContractManager> {
    const contractManager = new ContractManager()
    await contractManager.init(ethAdapter, safeAddress, contractNetworks)
    return contractManager
  }

  async init(
    ethAdapter: EthAdapter,
    safeAddress: string,
    contractNetworks?: ContractNetworksConfig
  ): Promise<void> {
    const chainId = await ethAdapter.getChainId()
    const customContracts = contractNetworks?.[chainId]
    this.#contractNetworks = contractNetworks
    this.#safeContract = await ethAdapter.getSafeContract(chainId, safeAddress)
    this.#multiSendContract = await ethAdapter.getMultiSendContract(
      chainId,
      customContracts?.multiSendAddress
    )
  }

  get contractNetworks(): ContractNetworksConfig | undefined {
    return this.#contractNetworks
  }

  get safeContract(): GnosisSafeContract {
    return this.#safeContract
  }

  get multiSendContract(): MultiSendContract {
    return this.#multiSendContract
  }
}

export default ContractManager
