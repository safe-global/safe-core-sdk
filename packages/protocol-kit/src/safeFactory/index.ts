import { SAFE_LAST_VERSION } from '@safe-global/protocol-kit/contracts/config'
import {
  getProxyFactoryContract,
  getSafeContract
} from '@safe-global/protocol-kit/contracts/safeDeploymentContracts'
import Safe from '@safe-global/protocol-kit/Safe'
import {
  ContractNetworksConfig,
  SafeAccountConfig,
  SafeDeploymentConfig
} from '@safe-global/protocol-kit/types'
import {
  EthAdapter,
  GnosisSafeContract,
  GnosisSafeProxyFactoryContract,
  SafeVersion,
  TransactionOptions
} from '@safe-global/safe-core-sdk-types'
import {
  predictSafeAddress,
  encodeSetupCallData,
  PREDETERMINED_SALT_NONCE,
  validateSafeAccountConfig,
  validateSafeDeploymentConfig
} from '@safe-global/protocol-kit/contracts/utils'

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
  /** isL1SafeMasterCopy - Forces to use the GnosisSafe L1 version of the contract instead of the L2 version */
  isL1SafeMasterCopy?: boolean
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}

interface SafeFactoryInitConfig {
  /** ethAdapter - Ethereum adapter */
  ethAdapter: EthAdapter
  /** safeVersion - Versions of the Safe deployed by this Factory contract */
  safeVersion: SafeVersion
  /** isL1SafeMasterCopy - Forces to use the GnosisSafe L1 version of the contract instead of the L2 version */
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
    this.#safeProxyFactoryContract = await getProxyFactoryContract({
      ethAdapter,
      safeVersion,
      customContracts
    })
    this.#gnosisSafeContract = await getSafeContract({
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
      safeContract: this.#gnosisSafeContract,
      customContracts
    })

    if (options?.gas && options?.gasLimit) {
      throw new Error('Cannot specify gas and gasLimit together in transaction options')
    }
    const safeAddress = await this.#safeProxyFactoryContract.createProxy({
      safeMasterCopyAddress: this.#gnosisSafeContract.getAddress(),
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
