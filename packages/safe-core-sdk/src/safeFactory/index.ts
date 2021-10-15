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
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}

class SafeFactory {
  #contractNetworks?: ContractNetworksConfig
  #ethAdapter!: EthAdapter
  #safeProxyFactoryContract!: GnosisSafeProxyFactoryContract
  #gnosisSafeContract!: GnosisSafeContract

  static async create({ ethAdapter, contractNetworks }: SafeFactoryConfig): Promise<SafeFactory> {
    const safeFactorySdk = new SafeFactory()
    await safeFactorySdk.init({ ethAdapter, contractNetworks })
    return safeFactorySdk
  }

  private async init({ ethAdapter, contractNetworks }: SafeFactoryConfig): Promise<void> {
    this.#ethAdapter = ethAdapter
    this.#contractNetworks = contractNetworks
    const chainId = await this.#ethAdapter.getChainId()
    const customContracts = contractNetworks?.[chainId]
    this.#safeProxyFactoryContract = await ethAdapter.getGnosisSafeProxyFactoryContract(
      chainId,
      customContracts?.safeProxyFactoryAddress
    )
    this.#gnosisSafeContract = await ethAdapter.getSafeContract(
      chainId,
      customContracts?.safeMasterCopyAddress
    )
  }

  getEthAdapter(): EthAdapter {
    return this.#ethAdapter
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

  getAddress() {
    return this.#safeProxyFactoryContract.getAddress()
  }

  async deploySafe(
    safeAccountConfig: SafeAccountConfig,
    safeDeploymentConfig?: SafeDeploymentConfig
  ): Promise<Safe> {
    validateSafeAccountConfig(safeAccountConfig)
    const chainId = await this.#ethAdapter.getChainId()
    const signerAddress = await this.#ethAdapter.getSignerAddress()
    const initializer = await this.encodeSetupCallData(safeAccountConfig)
    const safeAddress = await this.#safeProxyFactoryContract.createProxy({
      safeMasterCopyAddress: this.#gnosisSafeContract.getAddress(),
      initializer,
      saltNonce: safeDeploymentConfig?.saltNonce,
      options: { from: signerAddress }
    })
    const safeContract = await this.#ethAdapter.getSafeContract(chainId, safeAddress)
    const safe = Safe.create({
      ethAdapter: this.#ethAdapter,
      safeAddress: safeContract.getAddress(),
      contractNetworks: this.#contractNetworks
    })
    return safe
  }
}

export default SafeFactory
