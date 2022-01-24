import { GnosisSafeContract, MultiSendContract, SafeVersion } from '@gnosis.pm/safe-core-sdk-types'
import { SAFE_LAST_VERSION } from '../contracts/config'
import {
  getMultiSendContractDeployment,
  getSafeContractDeployment
} from '../contracts/safeDeploymentContracts'
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
    const customContracts = contractNetworks?.[chainId]
    this.#contractNetworks = contractNetworks
    this.#isL1SafeMasterCopy = isL1SafeMasterCopy

    let safeSingletonDeployment = getSafeContractDeployment(
      SAFE_LAST_VERSION,
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
    if ((await ethAdapter.getContractCode(temporarySafeContract.getAddress())) === '0x') {
      throw new Error('Safe Proxy contract is not deployed in the current network')
    }

    const safeVersion = (await temporarySafeContract.getVersion()) as SafeVersion
    safeSingletonDeployment = getSafeContractDeployment(safeVersion, chainId, isL1SafeMasterCopy)
    const safeContract = ethAdapter.getSafeContract({
      safeVersion,
      chainId,
      singletonDeployment: safeSingletonDeployment,
      customContractAddress: safeAddress,
      customContractAbi: customContracts?.safeMasterCopyAbi
    })
    if ((await ethAdapter.getContractCode(safeContract.getAddress())) === '0x') {
      throw new Error('Safe Proxy contract is not deployed in the current network')
    }
    this.#safeContract = safeContract

    const multiSendDeployment = getMultiSendContractDeployment(safeVersion, chainId)
    const multiSendContract = await ethAdapter.getMultiSendContract({
      safeVersion,
      chainId,
      singletonDeployment: multiSendDeployment,
      customContractAddress: customContracts?.multiSendAddress,
      customContractAbi: customContracts?.multiSendAbi
    })
    if ((await ethAdapter.getContractCode(multiSendContract.getAddress())) === '0x') {
      throw new Error('Multi Send contract is not deployed in the current network')
    }
    this.#multiSendContract = multiSendContract
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
