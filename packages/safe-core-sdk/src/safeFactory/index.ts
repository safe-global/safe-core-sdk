import { SafeVersion, SAFE_LAST_VERSION } from '../contracts/config'
import GnosisSafeContract from '../contracts/GnosisSafe/GnosisSafeContract'
import GnosisSafeProxyFactoryContract from '../contracts/GnosisSafeProxyFactory/GnosisSafeProxyFactoryContract'
import EthAdapter from '../ethereumLibs/EthAdapter'
import Safe from '../Safe'
import { ContractNetworksConfig } from '../types'
import { EMPTY_DATA, ZERO_ADDRESS } from '../utils/constants'
import { validateSafeAccountConfig } from './utils'

export interface SafeAccountConfig {
  owners: string[]
  threshold: number
  to?: string
  data?: string
  fallbackHandler?: string
  paymentToken?: string
  payment?: number
  paymentReceiver?: string
}

export interface SafeDeploymentConfig {
  saltNonce: number
}

export interface SafeFactoryConfig {
  /** ethAdapter - Ethereum adapter */
  ethAdapter: EthAdapter
  /** safeVersion - Versions of the Safe deployed by this Factory contract */
  safeVersion?: SafeVersion
  /** isL1SafeMasterCopy - Forces to use the Gnosis Safe L1 version of the contract instead of the L2 version */
  isL1SafeMasterCopy?: boolean
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}

interface SafeFactoryInitConfig {
  /** ethAdapter - Ethereum adapter */
  ethAdapter: EthAdapter
  /** safeVersion - Versions of the Safe deployed by this Factory contract */
  safeVersion: SafeVersion
  /** isL1SafeMasterCopy - Forces to use the Gnosis Safe L1 version of the contract instead of the L2 version */
  isL1SafeMasterCopy?: boolean
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}

class SafeFactory {
  #contractNetworks?: ContractNetworksConfig
  #isL1SafeMasterCopy?: boolean
  #safeVersion!: SafeVersion
  #ethAdapter!: EthAdapter
  #safeProxyFactoryContract!: GnosisSafeProxyFactoryContract
  #gnosisSafeContract!: GnosisSafeContract

  static async create({
    ethAdapter,
    safeVersion = SAFE_LAST_VERSION,
    isL1SafeMasterCopy = false,
    contractNetworks
  }: SafeFactoryConfig): Promise<SafeFactory> {
    const safeFactorySdk = new SafeFactory()
    await safeFactorySdk.init({ ethAdapter, safeVersion, isL1SafeMasterCopy, contractNetworks })
    return safeFactorySdk
  }

  private async init({
    ethAdapter,
    safeVersion,
    isL1SafeMasterCopy,
    contractNetworks
  }: SafeFactoryInitConfig): Promise<void> {
    this.#ethAdapter = ethAdapter
    this.#safeVersion = safeVersion
    this.#isL1SafeMasterCopy = isL1SafeMasterCopy
    this.#contractNetworks = contractNetworks
    const chainId = await this.#ethAdapter.getChainId()
    const customContracts = contractNetworks?.[chainId]
    const safeProxyFactoryContract = await ethAdapter.getSafeProxyFactoryContract(
      this.#safeVersion,
      chainId,
      customContracts?.safeProxyFactoryAddress
    )
    if ((await this.#ethAdapter.getContractCode(safeProxyFactoryContract.getAddress())) === '0x') {
      throw new Error('Safe Proxy Factory contract is not deployed in the current network')
    }
    this.#safeProxyFactoryContract = safeProxyFactoryContract

    const gnosisSafeContract = ethAdapter.getSafeContract({
      safeVersion: this.#safeVersion,
      chainId,
      isL1SafeMasterCopy,
      customContractAddress: customContracts?.safeMasterCopyAddress
    })
    if ((await this.#ethAdapter.getContractCode(gnosisSafeContract.getAddress())) === '0x') {
      throw new Error('Safe Proxy contract is not deployed in the current network')
    }
    this.#gnosisSafeContract = gnosisSafeContract
  }

  getEthAdapter(): EthAdapter {
    return this.#ethAdapter
  }

  getSafeVersion(): SafeVersion {
    return this.#safeVersion
  }

  getAddress(): string {
    return this.#safeProxyFactoryContract.getAddress()
  }

  async getChainId(): Promise<number> {
    return this.#ethAdapter.getChainId()
  }

  private async encodeSetupCallData({
    owners,
    threshold,
    to = ZERO_ADDRESS,
    data = EMPTY_DATA,
    fallbackHandler = ZERO_ADDRESS,
    paymentToken = ZERO_ADDRESS,
    payment = 0,
    paymentReceiver = ZERO_ADDRESS
  }: SafeAccountConfig): Promise<string> {
    return this.#gnosisSafeContract.encode('setup', [
      owners,
      threshold,
      to,
      data,
      fallbackHandler,
      paymentToken,
      payment,
      paymentReceiver
    ])
  }

  async deploySafe(
    safeAccountConfig: SafeAccountConfig,
    safeDeploymentConfig?: SafeDeploymentConfig
  ): Promise<Safe> {
    validateSafeAccountConfig(safeAccountConfig)
    const chainId = await this.#ethAdapter.getChainId()
    const signerAddress = await this.#ethAdapter.getSignerAddress()
    const initializer = await this.encodeSetupCallData(safeAccountConfig)
    const saltNonce =
      safeDeploymentConfig?.saltNonce ?? Date.now() * 1000 + Math.floor(Math.random() * 1000)
    const safeAddress = await this.#safeProxyFactoryContract.createProxy({
      safeMasterCopyAddress: this.#gnosisSafeContract.getAddress(),
      initializer,
      saltNonce,
      options: { from: signerAddress }
    })
    const safeContract = await this.#ethAdapter.getSafeContract({
      safeVersion: this.#safeVersion,
      chainId,
      isL1SafeMasterCopy: this.#isL1SafeMasterCopy,
      customContractAddress: safeAddress
    })
    if ((await this.#ethAdapter.getContractCode(safeContract.getAddress())) === '0x') {
      throw new Error('Safe Proxy contract is not deployed in the current network')
    }
    const safe = await Safe.create({
      ethAdapter: this.#ethAdapter,
      safeAddress: safeContract.getAddress(),
      isL1SafeMasterCopy: this.#isL1SafeMasterCopy,
      contractNetworks: this.#contractNetworks
    })
    return safe
  }
}

export default SafeFactory
