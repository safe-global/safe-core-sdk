import { GnosisSafe, MultiSend } from '../../typechain'
import MultiSendAbi from '../abis/MultiSendAbi.json'
import SafeAbiV120 from '../abis/SafeAbiV1-2-0.json'
import { ContractNetworksConfig, defaultContractNetworks } from '../configuration/contracts'
import EthAdapter from '../ethereumLibs/EthAdapter'

class ContractManager {
  #contractNetworks!: ContractNetworksConfig
  #safeContract!: GnosisSafe
  #multiSendContract!: MultiSend
  static async create(
    ethAdapter: EthAdapter,
    safeAddress: string,
    contractNetworks?: ContractNetworksConfig
  ) {
    const safeSdk = new ContractManager()
    await safeSdk.init(ethAdapter, safeAddress, contractNetworks)
    return safeSdk
  }

  async init(
    ethAdapter: EthAdapter,
    safeAddress: string,
    contractNetworks?: ContractNetworksConfig
  ) {
    const chainId = await ethAdapter.getChainId()
    const contractNetworksConfig = { ...defaultContractNetworks, ...contractNetworks }
    const contracts = contractNetworksConfig[chainId]
    if (!contracts) {
      throw new Error('Safe contracts not found in the current network')
    }
    this.#contractNetworks = contractNetworksConfig

    const safeContractCode = await ethAdapter.getContractCode(safeAddress)
    if (safeContractCode === '0x') {
      throw new Error('Safe Proxy contract is not deployed in the current network')
    }
    this.#safeContract = ethAdapter.getContract(safeAddress, SafeAbiV120)

    const multiSendContractCode = await ethAdapter.getContractCode(contracts.multiSendAddress)
    if (multiSendContractCode === '0x') {
      throw new Error('MultiSend contract is not deployed in the current network')
    }
    this.#multiSendContract = ethAdapter.getContract(contracts.multiSendAddress, MultiSendAbi)
  }

  get contractNetworks() {
    return this.#contractNetworks
  }

  get safeContract() {
    return this.#safeContract
  }

  get multiSendContract() {
    return this.#multiSendContract
  }
}

export default ContractManager
