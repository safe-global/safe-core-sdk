import Safe from '@safe-global/protocol-kit/Safe'
import { DEFAULT_SAFE_VERSION } from '@safe-global/protocol-kit/contracts/config'
import {
  getProxyFactoryContract,
  getSafeContract
} from '@safe-global/protocol-kit/contracts/safeDeploymentContracts'
import {
  PREDETERMINED_SALT_NONCE,
  encodeSetupCallData,
  predictSafeAddress,
  validateSafeAccountConfig,
  validateSafeDeploymentConfig
} from '@safe-global/protocol-kit/contracts/utils'
import {
  ContractNetworksConfig,
  SafeAccountConfig,
  SafeDeploymentConfig
} from '@safe-global/protocol-kit/types'
import {
  EthAdapter,
  SafeContract,
  SafeProxyFactoryContract,
  SafeVersion,
  TransactionOptions
} from '@safe-global/safe-core-sdk-types'

export interface DeploySafeProps {
  safeAccountConfig: SafeAccountConfig
  saltNonce?: string
  options?: TransactionOptions
  callback?: (txHash: string) => void
}

export interface SafeFactoryConfig {
  /** ethAdapter - Ethereum adapter */
  ethAdapter: EthAdapter
  /** safeVersion - Versions of the Safe deployed by this Factory contract */
  safeVersion?: SafeVersion
  /** isL1SafeMasterCopy - Forces to use the Safe L1 version of the contract instead of the L2 version */
  isL1SafeMasterCopy?: boolean
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}

interface SafeFactoryInitConfig {
  /** ethAdapter - Ethereum adapter */
  ethAdapter: EthAdapter
  /** safeVersion - Versions of the Safe deployed by this Factory contract */
  safeVersion: SafeVersion
  /** isL1SafeMasterCopy - Forces to use the Safe L1 version of the contract instead of the L2 version */
  isL1SafeMasterCopy?: boolean
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}

class SafeFactory {
  #contractNetworks?: ContractNetworksConfig
  #isL1SafeMasterCopy?: boolean
  #safeVersion!: SafeVersion
  #ethAdapter!: EthAdapter
  #safeProxyFactoryContract!: SafeProxyFactoryContract
  #safeContract!: SafeContract

  static async create({
    ethAdapter,
    safeVersion = DEFAULT_SAFE_VERSION,
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
    this.#safeProxyFactoryContract = await getProxyFactoryContract({
      ethAdapter,
      safeVersion,
      customContracts
    })
    this.#safeContract = await getSafeContract({
      ethAdapter,
      safeVersion,
      isL1SafeMasterCopy,
      customContracts
    })
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

  async predictSafeAddress(
    safeAccountConfig: SafeAccountConfig,
    saltNonce = PREDETERMINED_SALT_NONCE
  ): Promise<string> {
    const chainId = await this.#ethAdapter.getChainId()
    const customContracts = this.#contractNetworks?.[chainId]
    const safeVersion = this.#safeVersion
    const safeDeploymentConfig: SafeDeploymentConfig = { saltNonce, safeVersion }

    return predictSafeAddress({
      ethAdapter: this.#ethAdapter,
      safeAccountConfig,
      safeDeploymentConfig,
      isL1SafeMasterCopy: this.#isL1SafeMasterCopy,
      customContracts
    })
  }

  async deploySafe({
    safeAccountConfig,
    saltNonce = PREDETERMINED_SALT_NONCE,
    options,
    callback
  }: DeploySafeProps): Promise<Safe> {
    validateSafeAccountConfig(safeAccountConfig)
    validateSafeDeploymentConfig({ saltNonce })

    const signerAddress = await this.#ethAdapter.getSignerAddress()
    if (!signerAddress) {
      throw new Error('EthAdapter must be initialized with a signer to use this method')
    }

    const chainId = await this.getChainId()
    const customContracts = this.#contractNetworks?.[chainId]
    const initializer = await encodeSetupCallData({
      ethAdapter: this.#ethAdapter,
      safeAccountConfig,
      safeContract: this.#safeContract,
      customContracts
    })

    if (options?.gas && options?.gasLimit) {
      throw new Error('Cannot specify gas and gasLimit together in transaction options')
    }
    const safeAddress = await this.#safeProxyFactoryContract.createProxy({
      safeMasterCopyAddress: this.#safeContract.getAddress(),
      initializer,
      saltNonce,
      options: {
        from: signerAddress,
        ...options
      },
      callback
    })
    const isContractDeployed = await this.#ethAdapter.isContractDeployed(safeAddress)
    if (!isContractDeployed) {
      throw new Error('SafeProxy contract is not deployed on the current network')
    }
    const safe = await Safe.create({
      ethAdapter: this.#ethAdapter,
      safeAddress,
      isL1SafeMasterCopy: this.#isL1SafeMasterCopy,
      contractNetworks: this.#contractNetworks
    })
    return safe
  }
}

export default SafeFactory
