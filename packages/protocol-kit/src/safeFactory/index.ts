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
  SafeContractImplementationType,
  SafeDeploymentConfig,
  SafeProxyFactoryContractImplementationType
} from '@safe-global/protocol-kit/types'
import { SafeVersion, TransactionOptions } from '@safe-global/safe-core-sdk-types'
import { SafeProvider } from '../adapters/ethers'
import { Eip1193Provider } from '../adapters/ethAdapter'

export interface DeploySafeProps {
  safeAccountConfig: SafeAccountConfig
  saltNonce?: string
  options?: TransactionOptions
  callback?: (txHash: string) => void
}

export interface SafeFactoryConfig {
  /** provider - Ethereum EIP-1193 compatible provider */
  provider: Eip1193Provider
  signerAddress?: string
  privateKeyOrMnemonic?: string
  /** safeVersion - Versions of the Safe deployed by this Factory contract */
  safeVersion?: SafeVersion
  /** isL1SafeSingleton - Forces to use the Safe L1 version of the contract instead of the L2 version */
  isL1SafeSingleton?: boolean
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}

interface SafeFactoryInitConfig {
  /** provider - Ethereum EIP-1193 compatible provider */
  provider: Eip1193Provider
  signerAddress?: string
  privateKeyOrMnemonic?: string
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
  #safeProxyFactoryContract!: SafeProxyFactoryContractImplementationType
  #safeContract!: SafeContractImplementationType
  #provider!: Eip1193Provider
  #safeProvider!: SafeProvider

  static async create({
    provider,
    safeVersion = DEFAULT_SAFE_VERSION,
    isL1SafeSingleton = false,
    contractNetworks
  }: SafeFactoryConfig): Promise<SafeFactory> {
    const safeFactorySdk = new SafeFactory()
    await safeFactorySdk.init({ provider, safeVersion, isL1SafeSingleton, contractNetworks })
    return safeFactorySdk
  }

  private async init({
    provider,
    safeVersion,
    isL1SafeSingleton,
    contractNetworks
  }: SafeFactoryInitConfig): Promise<void> {
    this.#provider = provider
    this.#safeProvider = new SafeProvider({ providerOrUrl: provider })
    this.#safeVersion = safeVersion
    this.#isL1SafeSingleton = isL1SafeSingleton
    this.#contractNetworks = contractNetworks
    const chainId = await this.#safeProvider.getChainId()
    const customContracts = contractNetworks?.[chainId.toString()]
    this.#safeProxyFactoryContract = await getProxyFactoryContract({
      safeProvider: this.#safeProvider,
      safeVersion,
      customContracts
    })
    this.#safeContract = await getSafeContract({
      safeProvider: this.#safeProvider,
      safeVersion,
      isL1SafeSingleton,
      customContracts
    })
  }

  getSafeProvider(): SafeProvider {
    return this.#safeProvider
  }

  getSafeVersion(): SafeVersion {
    return this.#safeVersion
  }

  getAddress(): Promise<string> {
    return this.#safeProxyFactoryContract.getAddress()
  }

  async getChainId(): Promise<bigint> {
    return this.#safeProvider.getChainId()
  }

  async predictSafeAddress(
    safeAccountConfig: SafeAccountConfig,
    saltNonce?: string
  ): Promise<string> {
    const chainId = await this.#safeProvider.getChainId()
    const customContracts = this.#contractNetworks?.[chainId.toString()]
    const safeVersion = this.#safeVersion

    const safeDeploymentConfig: SafeDeploymentConfig = {
      saltNonce: saltNonce || getChainSpecificDefaultSaltNonce(chainId),
      safeVersion
    }

    return predictSafeAddress({
      safeProvider: this.#safeProvider,
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

    const signerAddress = await this.#safeProvider.getSignerAddress()
    if (!signerAddress) {
      throw new Error('ISafeProvider must be initialized with a signer to use this method')
    }

    const chainId = await this.getChainId()
    const customContracts = this.#contractNetworks?.[chainId.toString()]
    const initializer = await encodeSetupCallData({
      safeProvider: this.#safeProvider,
      safeAccountConfig,
      safeContract: this.#safeContract,
      customContracts
    })

    if (options?.gas && options?.gasLimit) {
      throw new Error('Cannot specify gas and gasLimit together in transaction options')
    }

    const safeAddress = await this.#safeProxyFactoryContract.createProxyWithOptions({
      safeSingletonAddress: await this.#safeContract.getAddress(),
      initializer,
      saltNonce: saltNonce || getChainSpecificDefaultSaltNonce(chainId),
      options: {
        from: signerAddress,
        ...options
      },
      callback
    })
    const isContractDeployed = await this.#safeProvider.isContractDeployed(safeAddress)
    if (!isContractDeployed) {
      throw new Error('SafeProxy contract is not deployed on the current network')
    }
    const safe = await Safe.create({
      provider: this.#provider,
      safeAddress,
      isL1SafeSingleton: this.#isL1SafeSingleton,
      contractNetworks: this.#contractNetworks
    })
    return safe
  }
}

export default SafeFactory
