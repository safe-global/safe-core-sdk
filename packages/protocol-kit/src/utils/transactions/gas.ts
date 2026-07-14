import {
  BaseError,
  CallExecutionErrorType,
  RawContractErrorType,
  encodeFunctionData,
  parseAbi
} from 'viem'
import { OperationType, SafeVersion, SafeTransaction } from '@safe-global/types-kit'
import semverSatisfies from 'semver/functions/satisfies.js'
import Safe from '@safe-global/protocol-kit/Safe'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import {
  ContractNetworksConfig,
  SafeContractImplementationType
} from '@safe-global/protocol-kit/types'
import { ZERO_ADDRESS } from '../constants'
import {
  getSafeContract,
  getSimulateTxAccessorContract
} from '../../contracts/safeDeploymentContracts'
import {
  isSafeContractCompatibleWithRequiredTxGas,
  isSafeContractCompatibleWithSimulateAndRevert
} from '../safeVersions'
import { asHex } from '../types'

// Every byte == 00 -> 4  Gas cost
const CALL_DATA_ZERO_BYTE_GAS_COST = 4

// Every byte != 00 -> 16 Gas cost (68 before Istanbul)
const CALL_DATA_BYTE_GAS_COST = 16

// Cold SLOAD surcharge (EIP-2929) — first access to a storage slot in a transaction
const COLD_SLOAD_GAS_COST = 2_100

// gas cost initialization of a Safe (SSTORE 0→non-zero on a cold slot = 20 000 + 2 100 cold-load surcharge per EIP-2929)
const INITIALIZATION_GAS_COST = 20_000 + COLD_SLOAD_GAS_COST

// increment nonce gas cost
const INCREMENT_NONCE_GAS_COST = 5_000

// Keccak gas cost for the hash of the Safe transaction
const HASH_GENERATION_GAS_COST = 1_500

// ecrecover gas cost for ecdsa ~= 4K gas, we use 6K
const ECRECOVER_GAS_COST = 6_000

// Intrinsic transaction fee charged by the EVM (always paid by the relayer)
const INTRINSIC_TX_GAS_COST = 21_000

// Cold SLOADs always paid in execTransaction: `threshold` (in checkSignatures) + `getGuard()` slot
const PRE_EXEC_STORAGE_GAS_COST = 2 * COLD_SLOAD_GAS_COST

// Headroom for SafeMath wrappers, memory expansion, and control-flow checks.
// Rounded up to leave slack for dynamic signature types and misc.
const MISC_OVERHEAD_GAS_COST = 900

// Base operations always paid on top of the contract-counted gas (not in safeTxGas / refundGas / events)
const EXTRA_BASE_GAS_COST =
  INTRINSIC_TX_GAS_COST + PRE_EXEC_STORAGE_GAS_COST + MISC_OVERHEAD_GAS_COST

// New account creation cost (EIP-161)
const NEW_ACCOUNT_GAS_COST = 25_000

// Cold address access (EIP-2929) — first touch of the refund receiver in this tx
const COLD_ACCOUNT_ACCESS_GAS_COST = 2_600

// SafeProxy to Safe Singleton delegatecall cost: cold SLOAD of the singleton slot
// (2_100) + cold DELEGATECALL to the singleton address (full EIP-2929 cold access 2_600, since
// the singleton is first touched here) + calldatacopy/returndatacopy/control-flow (~400).
const PROXY_FALLBACK_GAS_COST = COLD_SLOAD_GAS_COST + COLD_ACCOUNT_ACCESS_GAS_COST + 400

// Extra gas charged when CALL forwards a non-zero value
const CALL_VALUE_GAS_COST = 9_000

// Approximate ERC20 transfer gas:
//  - existing token holder: cold token + dispatch + 2 SSTOREs + LOG3 + Safe wrapper (~21k)
//  - new token holder: extra ~17k from SSTORE 0->non-zero on receiver balance (EIP-2200)
const ERC20_TRANSFER_GAS_COST = 21_000
const ERC20_NEW_HOLDER_TRANSFER_GAS_COST = 38_000

// LOG opcode gas costs (yellow paper)
const LOG_BASE_GAS_COST = 375
const LOG_TOPIC_GAS_COST = 375
const LOG_DATA_GAS_COST_PER_BYTE = 8

// ExecutionSuccess/ExecutionFailure event: ~1262 gas pre-1.3.0 (LOG1 + 64 bytes),
// ~1381 gas from 1.3.0 onwards (LOG2 with indexed txHash + 32 bytes). Flat estimate.
const EXECUTION_RESULT_EVENT_GAS_COST = 1_500

// Calculate gas for signatures
// (array count (3 -> r, s, v) + ecrecover costs + cold owners[signer] SLOAD) * signature count
// Each signer reads a distinct `owners` mapping slot in checkNSignatures (EIP-2929 cold)
const GAS_COST_PER_SIGNATURE =
  1 * CALL_DATA_BYTE_GAS_COST +
  2 * 32 * CALL_DATA_BYTE_GAS_COST +
  ECRECOVER_GAS_COST +
  COLD_SLOAD_GAS_COST

function estimateDataGasCosts(data: string): number {
  const bytes = data.match(/.{2}/g) as string[]

  return bytes.reduce((gasCost: number, currentByte: string) => {
    if (currentByte === '0x') {
      return gasCost + 0
    }

    if (currentByte === '00') {
      return gasCost + CALL_DATA_ZERO_BYTE_GAS_COST
    }

    return gasCost + CALL_DATA_BYTE_GAS_COST
  }, 0)
}

/**
 * Estimates the gas cost of the events emitted during execTransaction.
 * - The Safe singleton always emits ExecutionSuccess or ExecutionFailure.
 * - The SafeL2 singleton (>= 1.3.0) additionally emits SafeMultiSigTransaction
 *   in its onBeforeExecTransaction hook.
 */
function calculateExecTransactionEventsGas(
  isL1SafeSingleton: boolean,
  data: string,
  threshold: number
): number {
  let gas = EXECUTION_RESULT_EVENT_GAS_COST

  if (!isL1SafeSingleton) {
    // `SafeMultiSigTransaction` event for SafeL2
    const dataBytes = (data.length - 2) / 2
    const signaturesBytes = threshold * 65
    const headBytes = 11 * 32 // 11 top-level event params
    const dataDynamicBytes = 32 + Math.ceil(dataBytes / 32) * 32
    const signaturesDynamicBytes = 32 + Math.ceil(signaturesBytes / 32) * 32
    const additionalInfoDynamicBytes = 32 + 3 * 32 // (nonce, msg.sender, threshold)
    const eventDataBytes =
      headBytes + dataDynamicBytes + signaturesDynamicBytes + additionalInfoDynamicBytes
    gas += LOG_BASE_GAS_COST + LOG_TOPIC_GAS_COST + eventDataBytes * LOG_DATA_GAS_COST_PER_BYTE
  }

  return gas
}

async function isNewEthRefundReceiver(
  safeProvider: SafeProvider,
  gasToken: string,
  refundReceiver: string
): Promise<boolean> {
  if (
    gasToken.toLowerCase() !== ZERO_ADDRESS.toLowerCase() ||
    refundReceiver.toLowerCase() === ZERO_ADDRESS.toLowerCase()
  ) {
    return false
  }

  const [contractCode, nonce, balance] = await Promise.all([
    safeProvider.getContractCode(refundReceiver),
    safeProvider.getNonce(refundReceiver),
    safeProvider.getBalance(refundReceiver)
  ])

  return contractCode === '0x' && nonce === 0 && balance === 0n
}

async function hasExistingTokenBalance(
  safeProvider: SafeProvider,
  gasToken: string,
  account: string
): Promise<boolean> {
  const data = encodeFunctionData({
    abi: parseAbi(['function balanceOf(address account) view returns (uint256)']),
    functionName: 'balanceOf',
    args: [account as `0x${string}`]
  })
  try {
    const response = await safeProvider.call({ to: gasToken, from: gasToken, value: '0', data })
    return BigInt(response || '0x0') > 0n
  } catch {
    // Reverts and empty responses are treated as "no balance" (conservative: higher cost)
    return false
  }
}

/**
 * Estimates the gas cost of `handlePayment` in `execTransaction`.
 * - Returns 0 when `gasPrice` is 0 — `handlePayment` is gated by `if (gasPrice > 0)`.
 * - Native ETH refund: cold account access (EIP-2929) + value transfer; adds NEWACCOUNT
 *   (EIP-161) when the receiver is a fresh account.
 * - ERC20 refund: typical transfer cost; adds extra gas (SSTORE 0->non-zero per EIP-2200)
 *   when the receiver has no prior balance for the token.
 *
 * Note: underestimations are expected if `gasToken` is set and ERC20
 * contract is a proxy or includes additional logic
 */
async function calculateRefundGas(
  safeProvider: SafeProvider,
  gasPrice: string,
  gasToken: string,
  refundReceiver: string
): Promise<number> {
  if (BigInt(gasPrice) === 0n) {
    return 0
  }

  if (gasToken.toLowerCase() === ZERO_ADDRESS.toLowerCase()) {
    let gas = COLD_ACCOUNT_ACCESS_GAS_COST + CALL_VALUE_GAS_COST
    if (await isNewEthRefundReceiver(safeProvider, gasToken, refundReceiver)) {
      gas += NEW_ACCOUNT_GAS_COST
    }
    return gas
  }

  const hasBalance = await hasExistingTokenBalance(safeProvider, gasToken, refundReceiver)
  return hasBalance ? ERC20_TRANSFER_GAS_COST : ERC20_NEW_HOLDER_TRANSFER_GAS_COST
}

export async function estimateGas(
  safeVersion: SafeVersion,
  safeContract: SafeContractImplementationType,
  safeProvider: SafeProvider,
  to: string,
  valueInWei: string,
  data: string,
  operation: OperationType,
  customContracts?: ContractNetworksConfig
) {
  const chainId = await safeProvider.getChainId()
  const simulateTxAccessorContract = await getSimulateTxAccessorContract({
    safeProvider,
    safeVersion,
    customContracts: customContracts?.[chainId.toString()]
  })

  const transactionDataToEstimate = simulateTxAccessorContract.encode('simulate', [
    to,
    BigInt(valueInWei),
    asHex(data),
    operation
  ])

  const safeContractContractCompatibleWithSimulateAndRevert =
    await isSafeContractCompatibleWithSimulateAndRevert(safeContract)

  const safeFunctionToEstimate = safeContractContractCompatibleWithSimulateAndRevert.encode(
    'simulateAndRevert',
    [simulateTxAccessorContract.getAddress(), asHex(transactionDataToEstimate)]
  )
  const safeAddress = safeContract.getAddress()
  const transactionToEstimateGas = {
    to: safeAddress,
    value: '0',
    data: safeFunctionToEstimate,
    from: safeAddress
  }

  try {
    const encodedResponse = await safeProvider.call(transactionToEstimateGas)

    return decodeSafeTxGas(encodedResponse)
  } catch (error: any) {
    return parseSafeTxGasErrorResponse(error)
  }
}

export async function estimateTxGas(
  safeContract: SafeContractImplementationType,
  safeProvider: SafeProvider,
  to: string,
  valueInWei: string,
  data: string,
  operation: OperationType
): Promise<string> {
  const safeAddress = safeContract.getAddress()
  try {
    const estimateGas = await safeProvider.estimateGas({
      to,
      from: safeAddress,
      value: valueInWei,
      data
    })
    return estimateGas
  } catch (error) {
    if (operation === OperationType.DelegateCall) {
      return '0'
    }
    return Promise.reject(error)
  }
}

/**
 * This function estimates the baseGas of a Safe transaction.
 * The baseGas includes costs for:
 * - Generation of the Safe transaction hash (txHash)
 * - Increasing the nonce of the Safe
 * - Verifying the signatures of the Safe transaction
 * - Payment to relayers for executing the transaction
 * - Emitting events ExecutionSuccess or ExecutionFailure
 *
 * Note: it does not include the transaction execution cost (safeTxGas)
 *
 * @async
 * @function estimateTxBaseGas
 * @param {Safe} safe - The Safe instance containing all the information about the safe.
 * @param {SafeTransaction} safeTransaction - The transaction for which the baseGas is to be estimated.
 * @returns {Promise<string>} A Promise that resolves with the estimated baseGas as a string.
 */
export async function estimateTxBaseGas(
  safe: Safe,
  safeTransaction: SafeTransaction
): Promise<string> {
  const safeTransactionData = safeTransaction.data
  const { to, value, data, operation, safeTxGas, gasPrice, gasToken, refundReceiver } =
    safeTransactionData

  const encodeSafeTxGas = safeTxGas || 0
  const encodeBaseGas = 0
  const encodeGasPrice = 1
  const encodeGasToken = gasToken || ZERO_ADDRESS
  const encodeRefundReceiver = refundReceiver || ZERO_ADDRESS
  const signatures = '0x'
  const safeProvider = safe.getSafeProvider()
  const safeVersion = safe.getContractVersion()
  const contractManager = safe.getContractManager()
  const isL1SafeSingleton = contractManager.isL1SafeSingleton

  const [safeThreshold, safeNonce, chainId, refundGas] = await Promise.all([
    safe.getThreshold(),
    safe.getNonce(),
    safe.getChainId(),
    calculateRefundGas(safeProvider, gasPrice, encodeGasToken, encodeRefundReceiver)
  ])

  const signaturesGasCost = safeThreshold * GAS_COST_PER_SIGNATURE

  // TODO: Account for transaction guard hooks (checkTransaction, checkAfterExecution)
  // when a guard is set on the Safe — cost depends on the guard implementation.

  const customContracts = contractManager.contractNetworks?.[chainId.toString()]

  const safeSingletonContract = await getSafeContract({
    safeProvider,
    safeVersion,
    isL1SafeSingleton,
    customContracts
  })

  //TODO: We should explore contract versions and map to the correct types
  //@ts-expect-error: Type too complex to represent.
  const execTransactionData = safeSingletonContract.encode('execTransaction', [
    to,
    BigInt(value),
    data,
    operation,
    encodeSafeTxGas,
    encodeBaseGas,
    encodeGasPrice,
    encodeGasToken,
    encodeRefundReceiver,
    signatures
  ])

  // If nonce == 0, nonce storage has to be initialized
  const isSafeInitialized = safeNonce !== 0
  const incrementNonceGasCost = isSafeInitialized
    ? INCREMENT_NONCE_GAS_COST
    : INITIALIZATION_GAS_COST

  let baseGas =
    signaturesGasCost +
    estimateDataGasCosts(execTransactionData) +
    incrementNonceGasCost +
    HASH_GENERATION_GAS_COST

  // handlePayment refund gas
  baseGas += refundGas

  // Add events gas
  baseGas += calculateExecTransactionEventsGas(isL1SafeSingleton ?? false, data, safeThreshold)

  // Extra costs
  baseGas += EXTRA_BASE_GAS_COST

  // SafeProxy fallback hop (not counted by the singleton's gasUsed)
  baseGas += PROXY_FALLBACK_GAS_COST

  // Base gas encoding gas costs. Base gas was already encoded as `0` with `32 bytes (uint256)`, so we only need to add the data needed
  const baseGasUsedBytes = Math.ceil(baseGas.toString(16).length / 2)
  baseGas += baseGasUsedBytes * (CALL_DATA_BYTE_GAS_COST - CALL_DATA_ZERO_BYTE_GAS_COST)

  return baseGas.toString()
}

/**
 * This function estimates the safeTxGas of a Safe transaction.
 * The safeTxGas value represents the amount of gas required to execute the Safe transaction itself.
 * It does not include costs such as signature verification, transaction hash generation, nonce incrementing, and so on.
 *
 * The estimation method differs based on the version of the Safe:
 * - For versions >= 1.3.0, the simulate function defined in the simulateTxAccessor.sol Contract is used.
 * - For versions < 1.3.0, the deprecated requiredTxGas method defined in the GnosisSafe.sol contract is used.
 *
 * @async
 * @function estimateSafeTxGas
 * @param {Safe} safe - The Safe instance containing all the necessary information about the safe.
 * @param {SafeTransaction} safeTransaction - The transaction for which the safeTxGas is to be estimated.
 * @returns {Promise<string>} A Promise that resolves with the estimated safeTxGas as a string.
 *
 */
export async function estimateSafeTxGas(
  safe: Safe,
  safeTransaction: SafeTransaction
): Promise<string> {
  const safeVersion = safe.getContractVersion()

  if (semverSatisfies(safeVersion, '>=1.3.0')) {
    const safeTxGas = await estimateSafeTxGasWithSimulate(safe, safeTransaction)

    return addExtraGasForSafety(safeTxGas)
  }

  // deprecated method to estimate the safeTxGas of a Safe transaction
  const safeTxGas = await estimateSafeTxGasWithRequiredTxGas(safe, safeTransaction)

  return addExtraGasForSafety(safeTxGas)
}

/**
 * Increase the given safeTxGas gas amount by 5% as a security margin to avoid running out of gas.
 * In some contexts, the safeTxGas might be underestimated, leading to 'out of gas' errors during the Safe transaction execution
 *
 * @param {string} safeTxGas - The original safeTxGas gas amount.
 * @returns {string} The new safeTxGas gas amount, increased by 5% rounded.
 */
function addExtraGasForSafety(safeTxGas: string): string {
  const INCREASE_GAS_FACTOR = 1.05 // increase the gas by 5% as a security margin

  return Math.round(Number(safeTxGas) * INCREASE_GAS_FACTOR).toString()
}

/**
 * This function estimates the safeTxGas of a Safe transaction.
 * Using the deprecated method of requiredTxGas defined in the GnosisSafe contract. This method is meant to be used for Safe versions < 1.3.0.
 * see: https://github.com/safe-global/safe-contracts/blob/v1.2.0/contracts/GnosisSafe.sol#L276
 *
 * @async
 * @function estimateSafeTxGasWithRequiredTxGas
 * @param {Safe} safe - The Safe instance containing all the necessary information about the safe.
 * @param {SafeTransaction} safeTransaction - The transaction for which the safeTxGas is to be estimated.
 * @returns {Promise<string>} A Promise that resolves with the estimated safeTxGas as a string.
 *
 */
async function estimateSafeTxGasWithRequiredTxGas(
  safe: Safe,
  safeTransaction: SafeTransaction
): Promise<string> {
  const isSafeDeployed = await safe.isSafeDeployed()
  const safeAddress = await safe.getAddress()
  const safeVersion = safe.getContractVersion()
  const safeProvider = safe.getSafeProvider()
  const isL1SafeSingleton = safe.getContractManager().isL1SafeSingleton
  const chainId = await safe.getChainId()
  const customContracts = safe.getContractManager().contractNetworks?.[chainId.toString()]

  const safeSingletonContract = await getSafeContract({
    safeProvider,
    safeVersion,
    isL1SafeSingleton,
    customContracts
  })

  const safeContractCompatibleWithRequiredTxGas =
    await isSafeContractCompatibleWithRequiredTxGas(safeSingletonContract)

  const transactionDataToEstimate: string = safeContractCompatibleWithRequiredTxGas.encode(
    'requiredTxGas',
    [
      safeTransaction.data.to,
      BigInt(safeTransaction.data.value),
      asHex(safeTransaction.data.data),
      safeTransaction.data.operation
    ]
  )

  const to = isSafeDeployed ? safeAddress : safeSingletonContract.getAddress()

  const transactionToEstimateGas = {
    to,
    value: '0',
    data: transactionDataToEstimate,
    from: safeAddress
  }
  try {
    const encodedResponse = await safeProvider.call(transactionToEstimateGas)

    const safeTxGas = '0x' + encodedResponse.slice(-32)

    return safeTxGas

    // if the call throws an error we try to parse the returned value
  } catch (error: any) {
    try {
      const revertData = error?.info?.error?.data

      if (revertData && revertData.startsWith('Reverted ')) {
        const [, safeTxGas] = revertData.split('Reverted ')

        return Number(safeTxGas).toString()
      }
    } catch {
      return '0'
    }
  }

  return '0'
}

// TO-DO: Improve decoding
/*
  const simulateAndRevertResponse = safeProvider.decodeParameters(
    ['bool', 'bytes'],
    encodedResponse
  )
  const returnedData = safeProvider.decodeParameters(['uint256', 'bool', 'bytes'], simulateAndRevertResponse[1])
  */
function decodeSafeTxGas(encodedDataResponse: string): string {
  const [, encodedSafeTxGas] = encodedDataResponse.split('0x')
  const data = '0x' + encodedSafeTxGas

  return Number('0x' + data.slice(184).slice(0, 10)).toString()
}

type GnosisChainEstimationError = { info: { error: { data: string | { data: string } } } }
type EthersEstimationError = { data: string }
type ViemEstimationError = BaseError | CallExecutionErrorType
type EstimationError =
  | Error
  | EthersEstimationError
  | GnosisChainEstimationError
  | ViemEstimationError

function isEthersError(error: EstimationError): error is EthersEstimationError {
  return (error as EthersEstimationError).data != null
}

function isViemError(error: EstimationError): error is ViemEstimationError {
  return error instanceof BaseError
}

function isGnosisChainEstimationError(error: EstimationError): error is GnosisChainEstimationError {
  return (error as GnosisChainEstimationError).info.error.data != null
}

/**
 * Parses the SafeTxGas estimation response from different providers.
 * It extracts and decodes the SafeTxGas value from the Error object.
 *
 * @param {ProviderEstimationError} error - The estimation object with the estimation data.
 * @returns {string} The SafeTxGas value.
 * @throws It Will throw an error if the SafeTxGas cannot be parsed.
 */
function parseSafeTxGasErrorResponse(error: EstimationError): string {
  // Ethers v6
  if (isEthersError(error)) {
    return decodeSafeTxGas(error.data)
  }

  // viem
  if (isViemError(error)) {
    const cause = error.walk() as RawContractErrorType
    if (typeof cause?.data === 'string') {
      return decodeSafeTxGas(cause?.data)
    }
  }

  // gnosis-chain
  if (isGnosisChainEstimationError(error)) {
    const gnosisChainProviderData = error.info.error.data
    const isString = typeof gnosisChainProviderData === 'string'

    const encodedDataResponse = isString ? gnosisChainProviderData : gnosisChainProviderData.data
    return decodeSafeTxGas(encodedDataResponse)
  }

  // Error message
  const isEncodedDataPresent = error.message.includes('0x')

  if (isEncodedDataPresent) {
    return decodeSafeTxGas(error.message)
  }

  throw new Error('Could not parse SafeTxGas from Estimation response, Details: ' + error?.message)
}

/**
 * This function estimates the safeTxGas of a Safe transaction.
 * It uses the simulate function defined in the SimulateTxAccessor contract. This method is meant to be used for Safe versions >= 1.3.0.
 *
 * @async
 * @function estimateSafeTxGasWithSimulate
 * @param {Safe} safe - The Safe instance containing all the necessary information about the safe.
 * @param {SafeTransaction} safeTransaction - The transaction for which the safeTxGas is to be estimated.
 * @returns {Promise<string>} A Promise that resolves with the estimated safeTxGas as a string.
 *
 */
async function estimateSafeTxGasWithSimulate(
  safe: Safe,
  safeTransaction: SafeTransaction
): Promise<string> {
  const isSafeDeployed = await safe.isSafeDeployed()
  const safeAddress = await safe.getAddress()
  const safeVersion = safe.getContractVersion()
  const safeProvider = safe.getSafeProvider()
  const chainId = await safe.getChainId()
  const customContracts = safe.getContractManager().contractNetworks?.[chainId.toString()]
  const isL1SafeSingleton = safe.getContractManager().isL1SafeSingleton

  const safeSingletonContract = await getSafeContract({
    safeProvider,
    safeVersion,
    isL1SafeSingleton,
    customContracts
  })

  // new version of the estimation
  const simulateTxAccessorContract = await getSimulateTxAccessorContract({
    safeProvider,
    safeVersion,
    customContracts
  })

  const transactionDataToEstimate: string = simulateTxAccessorContract.encode('simulate', [
    safeTransaction.data.to,
    BigInt(safeTransaction.data.value),
    asHex(safeTransaction.data.data),
    safeTransaction.data.operation
  ])

  // if the Safe is not deployed we can use the singleton address to simulate
  const to = isSafeDeployed ? safeAddress : safeSingletonContract.getAddress()

  const SafeContractCompatibleWithSimulateAndRevert =
    await isSafeContractCompatibleWithSimulateAndRevert(safeSingletonContract)

  const safeFunctionToEstimate: string = SafeContractCompatibleWithSimulateAndRevert.encode(
    'simulateAndRevert',
    [simulateTxAccessorContract.getAddress(), asHex(transactionDataToEstimate)]
  )

  const transactionToEstimateGas = {
    to,
    value: '0',
    data: safeFunctionToEstimate,
    from: safeAddress
  }

  try {
    const encodedResponse = await safeProvider.call(transactionToEstimateGas)

    const safeTxGas = decodeSafeTxGas(encodedResponse)

    return safeTxGas

    // if the call throws an error we try to parse the returned value
  } catch (error: any) {
    return parseSafeTxGasErrorResponse(error)
  }
}

/**
 * This function estimates the gas cost of deploying a Safe.
 * It considers also the costs of the Safe setup call.
 * The setup call includes tasks such as setting up initial owners, defining the threshold, and initializing the salt nonce used for address generation.
 *
 * @async
 * @function estimateSafeDeploymentGas
 * @param {Safe} safe - The Safe object containing all necessary information about the safe, including owners, threshold, and saltNonce.
 * @returns {Promise<string>} A Promise that resolves with the estimated gas cost of the safe deployment as a string.
 */
export async function estimateSafeDeploymentGas(safe: Safe): Promise<string> {
  const isSafeDeployed = await safe.isSafeDeployed()

  if (isSafeDeployed) {
    return '0'
  }

  const safeProvider = safe.getSafeProvider()
  const safeDeploymentTransaction = await safe.createSafeDeploymentTransaction()

  const estimation = await safeProvider.estimateGas({
    ...safeDeploymentTransaction,
    from: ZERO_ADDRESS // if we use the Safe address the estimation always fails due to CREATE2
  })

  return estimation
}
