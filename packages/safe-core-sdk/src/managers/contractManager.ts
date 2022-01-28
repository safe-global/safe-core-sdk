import {
  EthAdapter,
  GnosisSafeContract,
  MultiSendContract,
  SafeVersion
} from '@gnosis.pm/safe-core-sdk-types'
import { SAFE_LAST_VERSION } from '../contracts/config'
import {
  getMultiSendContractDeployment,
  getSafeContractDeployment
} from '../contracts/safeDeploymentContracts'
import { SafeConfig } from '../Safe'
import { ContractNetworkConfig, ContractNetworksConfig } from '../types'

interface GetSafeContractInstanceProps {
  ethAdapter: EthAdapter
  safeVersion: SafeVersion
  chainId: number
  safeAddress: string
  isL1SafeMasterCopy?: boolean
  customContracts?: ContractNetworkConfig
}

interface GetMultiSendContractInstanceProps {
  ethAdapter: EthAdapter
  safeVersion: SafeVersion
  chainId: number
  customContracts?: ContractNetworkConfig
}

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
    const customContracts = contractNetworks?.[chainId]
    this.#contractNetworks = contractNetworks
    this.#isL1SafeMasterCopy = isL1SafeMasterCopy

    const temporarySafeContract = await this.getSafeContract({
      ethAdapter,
      safeVersion: SAFE_LAST_VERSION,
      chainId,
      safeAddress,
      isL1SafeMasterCopy,
      customContracts
    })
    const safeVersion = await temporarySafeContract.getVersion()
    this.#safeContract = await this.getSafeContract({
      ethAdapter,
      safeVersion,
      chainId,
      safeAddress,
      isL1SafeMasterCopy,
      customContracts
    })
    this.#multiSendContract = await this.getMultiSendContract({
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

  get safeContract(): GnosisSafeContract {
    return this.#safeContract
  }

  get multiSendContract(): MultiSendContract {
    return this.#multiSendContract
  }

  private async getSafeContract({
    ethAdapter,
    safeVersion,
    chainId,
    safeAddress,
    isL1SafeMasterCopy,
    customContracts
  }: GetSafeContractInstanceProps): Promise<GnosisSafeContract> {
    const safeSingletonDeployment = getSafeContractDeployment(
      safeVersion,
      chainId,
      isL1SafeMasterCopy
    )
    const temporarySafeContract = ethAdapter.getSafeContract({
      safeVersion: SAFE_LAST_VERSION,
      chainId,
      singletonDeployment: safeSingletonDeployment,
      customContractAddress: safeAddress,
      customContractAbi: customContracts?.safeMasterCopyAbi
    })
    const isContractDeployed = await ethAdapter.isContractDeployed(
      temporarySafeContract.getAddress()
    )
    if (!isContractDeployed) {
      throw new Error('Safe Proxy contract is not deployed in the current network')
    }
    return temporarySafeContract
  }

  private async getMultiSendContract({
    ethAdapter,
    safeVersion,
    chainId,
    customContracts
  }: GetMultiSendContractInstanceProps): Promise<MultiSendContract> {
    const multiSendDeployment = getMultiSendContractDeployment(safeVersion, chainId)
    const multiSendContract = await ethAdapter.getMultiSendContract({
      safeVersion,
      chainId,
      singletonDeployment: multiSendDeployment,
      customContractAddress: customContracts?.multiSendAddress,
      customContractAbi: customContracts?.multiSendAbi
    })
    const isContractDeployed = await ethAdapter.isContractDeployed(multiSendContract.getAddress())
    if (!isContractDeployed) {
      throw new Error('Multi Send contract is not deployed in the current network')
    }
    return multiSendContract
  }
}

export default ContractManager
