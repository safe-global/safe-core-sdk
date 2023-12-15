import Safe from '@safe-global/protocol-kit/Safe'
import { DEFAULT_SAFE_VERSION } from '@safe-global/protocol-kit/contracts/config'
import {
  getProxyFactoryContract,
  getSafeContract
} from '@safe-global/protocol-kit/contracts/safeDeploymentContracts'
import {
  encodeSetupCallData,
  getChainSpecificDefaultSaltNonce,
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
  /** isL1SafeSingleton - Forces to use the Safe L1 version of the contract instead of the L2 version */
  isL1SafeSingleton?: boolean
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}

interface SafeFactoryInitConfig {
  /** ethAdapter - Ethereum adapter */
  ethAdapter: EthAdapter
  /** safeVersion - Versions of the Safe deployed by this Factory contract */
  safeVersion: SafeVersion
  /** isL1SafeSingleton - Forces to use the Safe L1 version of the contract instead of the L2 version */
  isL1SafeSingleton?: boolean
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}

class SafeFactory {
  #contractNetworks?: ContractNetworksConfig
  #isL1SafeSingleton?: boolean
  #safeVersion!: SafeVersion
  #ethAdapter!: EthAdapter
  #safeProxyFactoryContract!: SafeProxyFactoryContract
  #safeContract!: SafeContract

  static async create({
    ethAdapter,
    safeVersion = DEFAULT_SAFE_VERSION,
    isL1SafeSingleton = false,
    contractNetworks
  }: SafeFactoryConfig): Promise<SafeFactory> {
    const safeFactorySdk = new SafeFactory()
    await safeFactorySdk.init({ ethAdapter, safeVersion, isL1SafeSingleton, contractNetworks })
    return safeFactorySdk
  }

  private async init({
    ethAdapter,
    safeVersion,
    isL1SafeSingleton,
    contractNetworks
  }: SafeFactoryInitConfig): Promise<void> {
    this.#ethAdapter = ethAdapter
    this.#safeVersion = safeVersion
    this.#isL1SafeSingleton = isL1SafeSingleton
    this.#contractNetworks = contractNetworks
    const chainId = await this.#ethAdapter.getChainId()
    const customContracts = contractNetworks?.[chainId.toString()]
    this.#safeProxyFactoryContract = await getProxyFactoryContract({
      ethAdapter,
      safeVersion,
      customContracts
    })
    this.#safeContract = await getSafeContract({
      ethAdapter,
      safeVersion,
      isL1SafeSingleton,
      customContracts
    })
  }

  getEthAdapter(): EthAdapter {
    return this.#ethAdapter
  }

  getSafeVersion(): SafeVersion {
    return this.#safeVersion
  }

  getAddress(): Promise<string> {
    return this.#safeProxyFactoryContract.getAddress()
  }

  async getChainId(): Promise<bigint> {
    return this.#ethAdapter.getChainId()
  }

  async predictSafeAddress(
    safeAccountConfig: SafeAccountConfig,
    saltNonce?: string
  ): Promise<string> {
    const chainId = await this.#ethAdapter.getChainId()
    const customContracts = this.#contractNetworks?.[chainId.toString()]
    const safeVersion = this.#safeVersion

    const safeDeploymentConfig: SafeDeploymentConfig = {
      saltNonce: saltNonce || getChainSpecificDefaultSaltNonce(chainId),
      safeVersion
    }

    return predictSafeAddress({
      ethAdapter: this.#ethAdapter,
      chainId,
      safeAccountConfig,
      safeDeploymentConfig,
      isL1SafeSingleton: this.#isL1SafeSingleton,
      customContracts
    })
  }

  async deploySafe({
    safeAccountConfig,
    saltNonce,
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
    const customContracts = this.#contractNetworks?.[chainId.toString()]
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
      safeSingletonAddress: await this.#safeContract.getAddress(),
      initializer,
      saltNonce: saltNonce || getChainSpecificDefaultSaltNonce(chainId),
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
      isL1SafeSingleton: this.#isL1SafeSingleton,
      contractNetworks: this.#contractNetworks
    })
    return safe
  }
}

export default SafeFactory
