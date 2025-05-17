import {
  concat,
  getContractAddress,
  Hash,
  Hex,
  isAddress,
  keccak256,
  pad,
  parseAbi,
  toHex,
  Client,
  WalletClient,
  toEventHash,
  FormattedTransactionReceipt,
  decodeEventLog
} from 'viem'
import { waitForTransactionReceipt } from 'viem/actions'
import { DEFAULT_SAFE_VERSION } from '@safe-global/protocol-kit/contracts/config'
import { EMPTY_DATA, ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import { createMemoizedFunction } from '@safe-global/protocol-kit/utils/memoized'
import { DeploymentType } from '@safe-global/protocol-kit/types'
import {
  SafeProxyFactoryContractType,
  SafeVersion,
  TransactionOptions,
  TransactionResult
} from '@safe-global/types-kit'
import semverSatisfies from 'semver/functions/satisfies.js'
import { asHex } from '../utils/types'
import {
  GetContractInstanceProps,
  GetSafeContractInstanceProps,
  getCompatibilityFallbackHandlerContract,
  getSafeProxyFactoryContract,
  getSafeContract
} from '../contracts/safeDeploymentContracts'
import {
  ContractNetworkConfig,
  ExternalClient,
  SafeAccountConfig,
  SafeContractImplementationType,
  SafeDeploymentConfig
} from '../types'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'

// keccak256(toUtf8Bytes('Safe Account Abstraction'))
export const PREDETERMINED_SALT_NONCE =
  '0xb1073742015cbcf5a3a4d9d1ae33ecf619439710b89475f92e2abd2117e90f90'

const ZKSYNC_MAINNET = 324n
const ZKSYNC_TESTNET = 300n
const ZKSYNC_LENS = 232n
// For bundle size efficiency we store SafeProxy.sol/GnosisSafeProxy.sol zksync bytecode hash in hex.
// To get the values below we need to:
// 1. Compile Safe smart contracts for zksync
// 2. Get `deployedBytecode` from SafeProxy.json/GnosisSafeProxy.json
// 3. Use zksync-web3 SDK to get the bytecode hash
//    const bytecodeHash = zkSyncUtils.hashBytecode(${deployedBytecode})
// 4. Use ethers to convert the array into hex
//    const deployedBytecodeHash = ethers.hexlify(bytecodeHash)
const ZKSYNC_SAFE_PROXY_DEPLOYED_BYTECODE: {
  [version: string]: { deployedBytecodeHash: Hash }
} = {
  '1.3.0': {
    deployedBytecodeHash: '0x0100004124426fb9ebb25e27d670c068e52f9ba631bd383279a188be47e3f86d'
  },
  '1.4.1': {
    deployedBytecodeHash: '0x0100003b6cfa15bd7d1cae1c9c022074524d7785d34859ad0576d8fab4305d4f'
  }
}

// keccak256(toUtf8Bytes('zksyncCreate2'))
const ZKSYNC_CREATE2_PREFIX = '0x2020dba91b30cc0006188af794c2fb30dd8520db7e2c088b7fc7c103c00ca494'

export interface PredictSafeAddressProps {
  safeProvider: SafeProvider
  chainId: bigint // required for performance
  safeAccountConfig: SafeAccountConfig
  safeDeploymentConfig?: SafeDeploymentConfig
  isL1SafeSingleton?: boolean
  customContracts?: ContractNetworkConfig
}

export interface encodeSetupCallDataProps {
  safeProvider: SafeProvider
  safeAccountConfig: SafeAccountConfig
  safeContract: SafeContractImplementationType
  customContracts?: ContractNetworkConfig
  customSafeVersion?: SafeVersion
  deploymentType?: DeploymentType
}

export function encodeCreateProxyWithNonce(
  safeProxyFactoryContract: SafeProxyFactoryContractType,
  safeSingletonAddress: string,
  initializer: string,
  salt?: string
) {
  return safeProxyFactoryContract.encode('createProxyWithNonce', [
    safeSingletonAddress,
    asHex(initializer),
    BigInt(salt || PREDETERMINED_SALT_NONCE)
  ])
}

const memoizedGetCompatibilityFallbackHandlerContract = createMemoizedFunction(
  getCompatibilityFallbackHandlerContract
)

export async function encodeSetupCallData({
  safeProvider,
  safeAccountConfig,
  safeContract,
  customContracts,
  customSafeVersion,
  deploymentType
}: encodeSetupCallDataProps): Promise<string> {
  const {
    owners,
    threshold,
    to = ZERO_ADDRESS,
    data = EMPTY_DATA,
    fallbackHandler,
    paymentToken = ZERO_ADDRESS,
    payment = 0,
    paymentReceiver = ZERO_ADDRESS
  } = safeAccountConfig

  const safeVersion = customSafeVersion || safeContract.safeVersion

  if (semverSatisfies(safeVersion, '<=1.0.0')) {
    return safeContract.encode('setup', [
      owners,
      threshold,
      to,
      asHex(data),
      paymentToken,
      payment,
      paymentReceiver
    ])
  }

  let fallbackHandlerAddress = fallbackHandler
  const isValidAddress = fallbackHandlerAddress !== undefined && isAddress(fallbackHandlerAddress)
  if (!isValidAddress) {
    const fallbackHandlerContract = await memoizedGetCompatibilityFallbackHandlerContract({
      safeProvider,
      safeVersion,
      customContracts,
      deploymentType
    })

    fallbackHandlerAddress = fallbackHandlerContract.getAddress()
  }

  return safeContract.encode('setup', [
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

// we need to include the chainId as string to prevent memoization issues see: https://github.com/safe-global/safe-core-sdk/issues/598
type MemoizedGetProxyFactoryContractProps = GetContractInstanceProps & {
  chainId: string
  deploymentType?: DeploymentType
}
type MemoizedGetSafeContractInstanceProps = GetSafeContractInstanceProps & {
  chainId: string
  deploymentType?: DeploymentType
}

const memoizedGetProxyFactoryContract = createMemoizedFunction(
  ({
    safeProvider,
    safeVersion,
    customContracts,
    deploymentType
  }: MemoizedGetProxyFactoryContractProps) =>
    getSafeProxyFactoryContract({ safeProvider, safeVersion, customContracts, deploymentType })
)

const memoizedGetProxyCreationCode = createMemoizedFunction(
  async ({
    safeProvider,
    safeVersion,
    customContracts,
    chainId,
    deploymentType
  }: MemoizedGetProxyFactoryContractProps) => {
    const safeProxyFactoryContract = await memoizedGetProxyFactoryContract({
      safeProvider,
      safeVersion,
      customContracts,
      chainId,
      deploymentType
    })

    return safeProxyFactoryContract.proxyCreationCode()
  }
)

const memoizedGetSafeContract = createMemoizedFunction(
  ({
    safeProvider,
    safeVersion,
    isL1SafeSingleton,
    customContracts,
    deploymentType
  }: MemoizedGetSafeContractInstanceProps) =>
    getSafeContract({
      safeProvider,
      safeVersion,
      isL1SafeSingleton,
      customContracts,
      deploymentType
    })
)

/**
 * Retrieves the version of the Safe contract associated with the given Safe address from the blockchain.
 *
 * @param {SafeProvider} safeProvider The provider to use when reading the contract.
 * @param {string} safeAddress The address of the Safe contract for which to retrieve the version.
 *
 * @returns {Promise<SafeVersion>} A promise resolving to the version of the Safe contract.
 * @throws when fetching an address which doesn't have a Safe deployed in it.
 */
export async function getSafeContractVersion(
  safeProvider: SafeProvider,
  safeAddress: string
): Promise<SafeVersion> {
  return (await safeProvider.readContract({
    address: safeAddress,
    abi: parseAbi(['function VERSION() view returns (string)']),
    functionName: 'VERSION'
  })) as SafeVersion
}

/**
 * Provides a chain-specific default salt nonce for generating unique addresses
 * for the same Safe configuration across different chains.
 *
 * @param {bigint} chainId - The chain ID associated with the chain.
 * @returns {string} The chain-specific salt nonce in hexadecimal format.
 */
export function getChainSpecificDefaultSaltNonce(chainId: bigint): string {
  return keccak256(toHex(PREDETERMINED_SALT_NONCE + chainId))
}

export async function getPredictedSafeAddressInitCode({
  safeProvider,
  chainId,
  safeAccountConfig,
  safeDeploymentConfig = {},
  isL1SafeSingleton,
  customContracts
}: PredictSafeAddressProps): Promise<string> {
  validateSafeAccountConfig(safeAccountConfig)
  validateSafeDeploymentConfig(safeDeploymentConfig)

  const {
    safeVersion = DEFAULT_SAFE_VERSION,
    saltNonce = getChainSpecificDefaultSaltNonce(chainId),
    deploymentType
  } = safeDeploymentConfig

  const safeProxyFactoryContract = await memoizedGetProxyFactoryContract({
    safeProvider,
    safeVersion,
    customContracts,
    chainId: chainId.toString(),
    deploymentType
  })

  const safeContract = await memoizedGetSafeContract({
    safeProvider,
    safeVersion,
    isL1SafeSingleton,
    customContracts,
    chainId: chainId.toString(),
    deploymentType
  })

  const initializer = await encodeSetupCallData({
    safeProvider,
    safeAccountConfig,
    safeContract,
    customContracts,
    customSafeVersion: safeVersion, // it is more efficient if we provide the safeVersion manually
    deploymentType
  })

  const encodedNonce = safeProvider.encodeParameters('uint256', [saltNonce])
  const safeSingletonAddress = safeContract.getAddress()
  const initCodeCallData = encodeCreateProxyWithNonce(
    safeProxyFactoryContract,
    safeSingletonAddress,
    initializer,
    encodedNonce
  )
  const safeProxyFactoryAddress = safeProxyFactoryContract.getAddress()
  const initCode = `0x${[safeProxyFactoryAddress, initCodeCallData].reduce(
    (acc, x) => acc + x.replace('0x', ''),
    ''
  )}`

  return initCode
}

export async function predictSafeAddress({
  safeProvider,
  chainId,
  safeAccountConfig,
  safeDeploymentConfig = {},
  isL1SafeSingleton,
  customContracts
}: PredictSafeAddressProps): Promise<string> {
  validateSafeAccountConfig(safeAccountConfig)
  validateSafeDeploymentConfig(safeDeploymentConfig)

  const {
    safeVersion = DEFAULT_SAFE_VERSION,
    saltNonce = getChainSpecificDefaultSaltNonce(chainId),
    deploymentType
  } = safeDeploymentConfig

  const safeProxyFactoryContract = await memoizedGetProxyFactoryContract({
    safeProvider,
    safeVersion,
    customContracts,
    chainId: chainId.toString(),
    deploymentType
  })

  const [proxyCreationCode] = await memoizedGetProxyCreationCode({
    safeProvider,
    safeVersion,
    customContracts,
    chainId: chainId.toString(),
    deploymentType
  })

  const safeContract = await memoizedGetSafeContract({
    safeProvider,
    safeVersion,
    isL1SafeSingleton,
    customContracts,
    chainId: chainId.toString(),
    deploymentType
  })

  const initializer = await encodeSetupCallData({
    safeProvider,
    safeAccountConfig,
    safeContract,
    customContracts,
    customSafeVersion: safeVersion, // it is more efficient if we provide the safeVersion manuall
    deploymentType
  })
  const initializerHash = keccak256(asHex(initializer))

  const encodedNonce = asHex(safeProvider.encodeParameters('uint256', [saltNonce]))

  const salt = keccak256(concat([initializerHash, encodedNonce]))

  const input = safeProvider.encodeParameters('address', [safeContract.getAddress()])

  const from = safeProxyFactoryContract.getAddress()

  // On the zkSync chains, the counterfactual deployment address is calculated differently
  const isZkSyncChain = [ZKSYNC_MAINNET, ZKSYNC_TESTNET, ZKSYNC_LENS].includes(chainId)
  if (isZkSyncChain) {
    const proxyAddress = zkSyncCreate2Address(from, safeVersion, salt, asHex(input))

    return safeProvider.getChecksummedAddress(proxyAddress)
  }

  const initCode = concat([proxyCreationCode, asHex(input)])

  const proxyAddress = getContractAddress({
    from,
    bytecode: initCode,
    opcode: 'CREATE2',
    salt
  })

  return safeProvider.getChecksummedAddress(proxyAddress)
}

export const validateSafeAccountConfig = ({ owners, threshold }: SafeAccountConfig): void => {
  if (owners.length <= 0) throw new Error('Owner list must have at least one owner')
  if (threshold <= 0) throw new Error('Threshold must be greater than or equal to 1')
  if (threshold > owners.length)
    throw new Error('Threshold must be lower than or equal to owners length')
}

export const validateSafeDeploymentConfig = ({ saltNonce }: SafeDeploymentConfig): void => {
  if (saltNonce && BigInt(saltNonce) < 0)
    throw new Error('saltNonce must be greater than or equal to 0')
}

/**
 * Returns the ProxyCreation Event based on the Safe version
 *
 * based on the Safe Version, we have different proxyCreation events
 *
 * @param {safeVersion} safeVersion - The Safe Version.
 * @returns {string} - The ProxyCreation event.
 */

function getProxyCreationEvent(safeVersion: SafeVersion): string {
  // Events inputs here are left unnamed to deal with the decoding as a list: https://github.com/wevm/viem/blob/632d4b9fa074f4da722e26b28607947d2c14ad2d/src/utils/abi/decodeEventLog.ts#L128
  const isLegacyProxyCreationEvent = semverSatisfies(safeVersion, '<1.3.0')

  if (isLegacyProxyCreationEvent) {
    return 'event ProxyCreation(address)' // v1.0.0, 1.1.1 & v1.2.0
  }

  if (semverSatisfies(safeVersion, '=1.3.0')) {
    return 'event ProxyCreation(address, address)' // v1.3.0
  }

  return 'event ProxyCreation(address indexed, address)' // >= v1.4.1
}

/**
 * Returns the address of a SafeProxy Address from the transaction receipt.
 *
 * This function looks for a ProxyCreation event in the transaction receipt logs to get address of the deployed SafeProxy.
 *
 * @param {FormattedTransactionReceipt} txReceipt - The transaction receipt containing logs.
 * @param {safeVersion} safeVersion - The Safe Version.
 * @returns {string} - The address of the deployed SafeProxy.
 * @throws {Error} - Throws an error if the SafeProxy was not deployed correctly.
 */

export function getSafeAddressFromDeploymentTx(
  txReceipt: FormattedTransactionReceipt,
  safeVersion: SafeVersion
): string {
  const eventHash = toEventHash(getProxyCreationEvent(safeVersion))
  const proxyCreationEvent = txReceipt?.logs.find((event) => event.topics[0] === eventHash)

  if (!proxyCreationEvent) {
    throw new Error('SafeProxy was not deployed correctly')
  }

  const { data, topics } = proxyCreationEvent

  const { args } = decodeEventLog({
    abi: parseAbi([getProxyCreationEvent(safeVersion)]),
    eventName: 'ProxyCreation',
    data,
    topics
  })

  if (!args || !args.length) {
    throw new Error('SafeProxy was not deployed correctly')
  }

  return args[0] as string
}

/**
 * Generates a zkSync Era address. zkSync Era uses a distinct address derivation method compared to Ethereum
 * see: https://docs.zksync.io/build/developer-reference/ethereum-differences/evm-instructions/#address-derivation
 *
 * @param {`string`} from - The sender's address.
 * @param {SafeVersion} safeVersion - The version of the safe.
 * @param {`0x${string}`} salt - The salt used for address derivation.
 * @param {`0x${string}`} input - Additional input data for the derivation.
 *
 * @returns {string} The derived zkSync address.
 */
export function zkSyncCreate2Address(
  from: string,
  safeVersion: SafeVersion,
  salt: Hex,
  input: Hex
): string {
  const bytecodeHash = ZKSYNC_SAFE_PROXY_DEPLOYED_BYTECODE[safeVersion].deployedBytecodeHash
  const inputHash = keccak256(input)

  const addressBytes = keccak256(
    concat([ZKSYNC_CREATE2_PREFIX, pad(asHex(from)), salt, bytecodeHash, inputHash])
  ).slice(26)

  return `0x${addressBytes}`
}

export function toTxResult(
  runner: ExternalClient,
  hash: Hash,
  options?: TransactionOptions
): TransactionResult {
  return {
    hash,
    options,
    transactionResponse: {
      wait: async () => waitForTransactionReceipt(runner, { hash })
    }
  }
}

export function isEthersSigner(signer: any): signer is Client {
  const isPasskeySigner = !!signer?.passkeyRawId
  // Check for both viem wallets and our ethers adapter
  return typeof signer?.signTypedData === 'function' && !isPasskeySigner
}

/**
 * Check if the signerOrProvider is compatible with `Signer`
 * @param signerOrProvider - Signer or provider
 * @returns true if the parameter is compatible with `Signer`
 */
export function isSignerCompatible(signerOrProvider: Client | WalletClient): boolean {
  const candidate = signerOrProvider as WalletClient

  const isSigntransactionCompatible = typeof candidate.signTransaction === 'function'
  const isSignMessageCompatible = typeof candidate.signMessage === 'function'
  const isGetAddressCompatible = typeof candidate.getAddresses === 'function'

  return isSigntransactionCompatible && isSignMessageCompatible && isGetAddressCompatible
}
