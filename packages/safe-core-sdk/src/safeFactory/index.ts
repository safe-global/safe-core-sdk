import {
  EthAdapter,
  GnosisSafeContract,
  GnosisSafeProxyFactoryContract,
  SafeVersion,
  TransactionOptions
} from '@safe-global/safe-core-sdk-types'
import { generateAddress2, keccak256, toBuffer } from 'ethereumjs-util'
import semverSatisfies from 'semver/functions/satisfies'
import { utils as zkSyncUtils } from 'zksync-web3'

import { SAFE_LAST_VERSION } from '../contracts/config'
import {
  getCompatibilityFallbackHandlerContract,
  getProxyFactoryContract,
  getSafeContract
} from '../contracts/safeDeploymentContracts'
import Safe from '../Safe'
import { ContractNetworksConfig } from '../types'
import { EMPTY_DATA, ZERO_ADDRESS } from '../utils/constants'
import { validateSafeAccountConfig, validateSafeDeploymentConfig } from './utils'

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
  saltNonce: string
}

export interface PredictSafeProps {
  safeAccountConfig: SafeAccountConfig
  safeDeploymentConfig: SafeDeploymentConfig
}

export interface DeploySafeProps {
  safeAccountConfig: SafeAccountConfig
  safeDeploymentConfig?: SafeDeploymentConfig
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

const ZKSYNC_MAINNET = 324
const ZKSYNC_TESTNET = 280
// For bundle size efficiency we store SafeProxy.sol/GnosisSafeProxy.sol zksync bytecode hash in hex.
// To get the values below we need to:
// 1. Compile Safe smart contracts for zksync
// 2. Get `deployedBytecode` from SafeProxy.json/GnosisSafeProxy.json
// 3. Use zksync-web3 SDK to get the bytecode hash
//    const bytecodeHash = zkSyncUtils.hashBytecode(${deployedBytecode})
// 4. Use ethers to convert the array into hex
//    const deployedBytecodeHash = ethers.utils.hexlify(bytecodeHash)
const ZKSYNC_SAFE_PROXY_DEPLOYED_BYTECODE: {
  [version: string]: { deployedBytecodeHash: string }
} = {
  '1.3.0': {
    deployedBytecodeHash: '0x0100004124426fb9ebb25e27d670c068e52f9ba631bd383279a188be47e3f86d'
  }
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
      chainId,
      customContracts
    })
    this.#gnosisSafeContract = await getSafeContract({
      ethAdapter,
      safeVersion,
      chainId,
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

  private async encodeSetupCallData({
    owners,
    threshold,
    to = ZERO_ADDRESS,
    data = EMPTY_DATA,
    fallbackHandler,
    paymentToken = ZERO_ADDRESS,
    payment = 0,
    paymentReceiver = ZERO_ADDRESS
  }: SafeAccountConfig): Promise<string> {
    if (semverSatisfies(this.#safeVersion, '<=1.0.0')) {
      return this.#gnosisSafeContract.encode('setup', [
        owners,
        threshold,
        to,
        data,
        paymentToken,
        payment,
        paymentReceiver
      ])
    }
    let fallbackHandlerAddress: string
    if (fallbackHandler) {
      fallbackHandlerAddress = fallbackHandler
    } else {
      const chainId = await this.#ethAdapter.getChainId()
      const customContracts = this.#contractNetworks?.[chainId]
      const fallbackHandlerContract = await getCompatibilityFallbackHandlerContract({
        ethAdapter: this.#ethAdapter,
        safeVersion: this.#safeVersion,
        chainId,
        customContracts
      })
      fallbackHandlerAddress = fallbackHandlerContract.getAddress()
    }
    return this.#gnosisSafeContract.encode('setup', [
      owners,
      threshold,
      to,
      data,
      fallbackHandlerAddress,
      paymentToken,
      payment,
      paymentReceiver
    ])
  }

  async predictSafeAddress({
    safeAccountConfig,
    safeDeploymentConfig
  }: PredictSafeProps): Promise<string> {
    validateSafeAccountConfig(safeAccountConfig)
    validateSafeDeploymentConfig(safeDeploymentConfig)

    const from = this.#safeProxyFactoryContract.getAddress()

    const initializer = await this.encodeSetupCallData(safeAccountConfig)
    const saltNonce = safeDeploymentConfig.saltNonce
    const encodedNonce = toBuffer(
      this.#ethAdapter.encodeParameters(['uint256'], [saltNonce])
    ).toString('hex')

    const salt = keccak256(
      toBuffer('0x' + keccak256(toBuffer(initializer)).toString('hex') + encodedNonce)
    )

    const proxyCreationCode = await this.#safeProxyFactoryContract.proxyCreationCode()

    const input = this.#ethAdapter.encodeParameters(
      ['address'],
      [this.#gnosisSafeContract.getAddress()]
    )

    const chainId = await this.#ethAdapter.getChainId()
    // zkSync Era counterfactual deployment is calculated differently
    // https://era.zksync.io/docs/reference/architecture/differences-with-ethereum.html#create-create2
    if ([ZKSYNC_MAINNET, ZKSYNC_TESTNET].includes(chainId)) {
      const safeVersion = await this.#gnosisSafeContract.getVersion()
      const bytecodeHash = ZKSYNC_SAFE_PROXY_DEPLOYED_BYTECODE[safeVersion].deployedBytecodeHash
      return zkSyncUtils.create2Address(from, bytecodeHash, salt, input)
    }

    const constructorData = toBuffer(input).toString('hex')
    const initCode = proxyCreationCode + constructorData

    const proxyAddress =
      '0x' + generateAddress2(toBuffer(from), toBuffer(salt), toBuffer(initCode)).toString('hex')
    return this.#ethAdapter.getChecksummedAddress(proxyAddress)
  }

  async deploySafe({
    safeAccountConfig,
    safeDeploymentConfig,
    options,
    callback
  }: DeploySafeProps): Promise<Safe> {
    validateSafeAccountConfig(safeAccountConfig)
    if (safeDeploymentConfig) {
      validateSafeDeploymentConfig(safeDeploymentConfig)
    }
    const signerAddress = await this.#ethAdapter.getSignerAddress()
    if (!signerAddress) {
      throw new Error('EthAdapter must be initialized with a signer to use this method')
    }
    const initializer = await this.encodeSetupCallData(safeAccountConfig)
    const saltNonce =
      safeDeploymentConfig?.saltNonce ??
      (Date.now() * 1000 + Math.floor(Math.random() * 1000)).toString()

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
