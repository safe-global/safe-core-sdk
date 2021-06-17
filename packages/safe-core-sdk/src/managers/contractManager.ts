import { GnosisSafe__factory } from '../../typechain/ethers-v5/factories/GnosisSafe__factory'
import { MultiSend__factory } from '../../typechain/ethers-v5/factories/MultiSend__factory'
import { GnosisSafe as GnosisSafeWeb3 } from '../../typechain/web3-v1/GnosisSafe'
import { MultiSend as MultiSendWeb3 } from '../../typechain/web3-v1/MultiSend'
import { ContractNetworksConfig, defaultContractNetworks } from '../configuration/contracts'
import SafeAbiV120 from '../contracts/GnosisSafe//SafeAbiV1-2-0.json'
import GnosisSafeContract from '../contracts/GnosisSafe/GnosisSafeContract'
import GnosisSafeEthersV5Contract from '../contracts/GnosisSafe/GnosisSafeEthersV5Contract'
import GnosisSafeWeb3Contract from '../contracts/GnosisSafe/GnosisSafeWeb3Contract'
import MultiSendAbi from '../contracts/MultiSend//MultiSendAbi.json'
import MultiSendContract from '../contracts/MultiSend/MultiSendContract'
import MultiSendEthersV5Contract from '../contracts/MultiSend/MultiSendEthersV5Contract'
import MultiSendWeb3Contract from '../contracts/MultiSend/MultiSendWeb3Contract'
import EthAdapter from '../ethereumLibs/EthAdapter'
import EthersAdapter from '../ethereumLibs/EthersAdapter'
import Web3Adapter from '../ethereumLibs/Web3Adapter'

class ContractManager {
  #contractNetworks!: ContractNetworksConfig
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

    const multiSendContractCode = await ethAdapter.getContractCode(contracts.multiSendAddress)
    if (multiSendContractCode === '0x') {
      throw new Error('MultiSend contract is not deployed in the current network')
    }

    if (ethAdapter instanceof EthersAdapter) {
      const providerOrSigner = ethAdapter.getSigner() || ethAdapter.getProvider()
      const safeContract = GnosisSafe__factory.connect(safeAddress, providerOrSigner)
      this.#safeContract = new GnosisSafeEthersV5Contract(safeContract)
      const multiSendContract = MultiSend__factory.connect(
        contracts.multiSendAddress,
        providerOrSigner
      )
      this.#multiSendContract = new MultiSendEthersV5Contract(multiSendContract)
    } else if (ethAdapter instanceof Web3Adapter) {
      const safeContract = ethAdapter.getContract(safeAddress, SafeAbiV120) as any as GnosisSafeWeb3
      this.#safeContract = new GnosisSafeWeb3Contract(safeContract)
      const multiSendContract = ethAdapter.getContract(
        contracts.multiSendAddress,
        MultiSendAbi
      ) as any as MultiSendWeb3
      this.#multiSendContract = new MultiSendWeb3Contract(multiSendContract)
    } else {
      throw new Error('Ethereum Adapter not supported')
    }
  }

  get contractNetworks(): ContractNetworksConfig {
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
