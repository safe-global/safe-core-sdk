import { BigNumber } from '@ethersproject/bignumber'
import {
  EthAdapter,
  SafeContract,
  OperationType,
  SafeVersion,
  SafeTransaction
} from '@safe-global/safe-core-sdk-types'
import semverSatisfies from 'semver/functions/satisfies'
import Safe from '@safe-global/protocol-kit/Safe'
import { ContractNetworksConfig } from '@safe-global/protocol-kit/types'
import { ZERO_ADDRESS } from '../constants'
import {
  getSafeContract,
  getSimulateTxAccessorContract
} from '../../contracts/safeDeploymentContracts'

// Every byte == 00 -> 4  Gas cost
const CALL_DATA_ZERO_BYTE_GAS_COST = 4

// Every byte != 00 -> 16 Gas cost (68 before Istanbul)
const CALL_DATA_BYTE_GAS_COST = 16

// gas cost initialization of a Safe
const INITIZATION_GAS_COST = 20_000

// increment nonce gas cost
const INCREMENT_NONCE_GAS_COST = 5_000

// Keccak gas cost for the hash of the Safe transaction
const HASH_GENERATION_GAS_COST = 1_500

// ecrecover gas cost for ecdsa ~= 4K gas, we use 6K
const ECRECOVER_GAS_COST = 6_000

// transfer gas cost
const TRANSAFER_GAS_COST = 32_000

// numbers < 256 (0x00(31*2)..ff) are 192 -> 31 * 4 + 1 * CALL_DATA_BYTE_GAS_COST
// numbers < 65535 (0x(30*2)..ffff) are 256 -> 30 * 4 + 2 * CALL_DATA_BYTE_GAS_COST
// Calculate gas for signatures
// (array count (3 -> r, s, v) + ecrecover costs) * signature count
const GAS_COST_PER_SIGNATURE =
  1 * CALL_DATA_BYTE_GAS_COST + 2 * 32 * CALL_DATA_BYTE_GAS_COST + ECRECOVER_GAS_COST

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

export async function estimateGas(
  safeVersion: SafeVersion,
  safeContract: SafeContract,
  ethAdapter: EthAdapter,
  to: string,
  valueInWei: string,
  data: string,
  operation: OperationType,
  customContracts?: ContractNetworksConfig
) {
  const chainId = await ethAdapter.getChainId()
  const simulateTxAccessorContract = await getSimulateTxAccessorContract({
    ethAdapter,
    safeVersion,
    customContracts: customContracts?.[chainId]
  })

  const transactionDataToEstimate = simulateTxAccessorContract.encode('simulate', [
    to,
    valueInWei,
    data,
    operation
  ])
  const safeFunctionToEstimate = safeContract.encode('simulateAndRevert', [
    await simulateTxAccessorContract.getAddress(),
    transactionDataToEstimate
  ])
  const safeAddress = safeContract.getAddress()
  const transactionToEstimateGas = {
    to: safeAddress,
    value: '0',
    data: safeFunctionToEstimate,
    from: safeAddress
  }

  try {
    const encodedResponse = await ethAdapter.call(transactionToEstimateGas)

    return Number('0x' + encodedResponse.slice(184).slice(0, 10)).toString()
  } catch (error: any) {
    return parseSafeTxGasErrorResponse(error)
  }
}

export async function estimateTxGas(
  safeContract: SafeContract,
  ethAdapter: EthAdapter,
  to: string,
  valueInWei: string,
  data: string,
  operation: OperationType
): Promise<string> {
  let txGasEstimation = BigNumber.from(0)
  const safeAddress = safeContract.getAddress()

  const estimateData: string = safeContract.encode('requiredTxGas', [
    to,
    valueInWei,
    data,
    operation
  ])
  try {
    const estimateResponse = await ethAdapter.estimateGas({
      to: safeAddress,
      from: safeAddress,
      data: estimateData
    })
    txGasEstimation = BigNumber.from('0x' + estimateResponse.substring(138)).add(10000)
  } catch (error) {}

  if (txGasEstimation.gt(0)) {
    const dataGasEstimation = estimateDataGasCosts(estimateData)
    let additionalGas = 10000
    for (let i = 0; i < 10; i++) {
      try {
        const estimateResponse = await ethAdapter.call({
          to: safeAddress,
          from: safeAddress,
          data: estimateData,
          gasPrice: '0',
          gasLimit: txGasEstimation.add(dataGasEstimation).add(additionalGas).toString()
        })
        if (estimateResponse !== '0x') {
          break
        }
      } catch (error) {}
      txGasEstimation = txGasEstimation.add(additionalGas)
      additionalGas *= 2
    }
    return txGasEstimation.add(additionalGas).toString()
  }

  try {
    const estimateGas = await ethAdapter.estimateGas({
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
  const { to, value, data, operation, safeTxGas, gasToken, refundReceiver } = safeTransactionData

  const safeThreshold = await safe.getThreshold()
  const safeNonce = await safe.getNonce()

  const signaturesGasCost = safeThreshold * GAS_COST_PER_SIGNATURE

  const encodeSafeTxGas = safeTxGas || 0
  const encodeBaseGas = 0
  const gasPrice = 1
  const encodeGasToken = gasToken || ZERO_ADDRESS
  const encodeRefundReceiver = refundReceiver || ZERO_ADDRESS
  const signatures = '0x'

  const safeVersion = await safe.getContractVersion()
  const ethAdapter = safe.getEthAdapter()
  const isL1SafeMasterCopy = safe.getContractManager().isL1SafeMasterCopy
  const chainId = await safe.getChainId()
  const customContracts = safe.getContractManager().contractNetworks?.[chainId]

  const safeSingletonContract = await getSafeContract({
    ethAdapter,
    safeVersion,
    isL1SafeMasterCopy,
    customContracts
  })

  const execTransactionData: string = safeSingletonContract.encode('execTransaction', [
    to,
    value,
    data,
    operation,
    encodeSafeTxGas,
    encodeBaseGas,
    gasPrice,
    encodeGasToken,
    encodeRefundReceiver,
    signatures
  ])

  // If nonce == 0, nonce storage has to be initialized
  const isSafeInitialized = safeNonce !== 0
  const incrementNonceGasCost = isSafeInitialized ? INCREMENT_NONCE_GAS_COST : INITIZATION_GAS_COST

  let baseGas =
    signaturesGasCost +
    estimateDataGasCosts(execTransactionData) +
    incrementNonceGasCost +
    HASH_GENERATION_GAS_COST

  // Add additional gas costs
  baseGas > 65536 ? (baseGas += 64) : (baseGas += 128)

  // Base tx costs, transfer costs...
  baseGas += TRANSAFER_GAS_COST

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
  const safeVersion = await safe.getContractVersion()

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
  const safeVersion = await safe.getContractVersion()
  const ethAdapter = safe.getEthAdapter()
  const isL1SafeMasterCopy = safe.getContractManager().isL1SafeMasterCopy
  const chainId = await safe.getChainId()
  const customContracts = safe.getContractManager().contractNetworks?.[chainId]

  const safeSingletonContract = await getSafeContract({
    ethAdapter,
    safeVersion,
    isL1SafeMasterCopy,
    customContracts
  })

  const transactionDataToEstimate: string = safeSingletonContract.encode('requiredTxGas', [
    safeTransaction.data.to,
    safeTransaction.data.value,
    safeTransaction.data.data,
    safeTransaction.data.operation
  ])

  const to = isSafeDeployed ? safeAddress : safeSingletonContract.getAddress()

  const transactionToEstimateGas = {
    to,
    value: '0',
    data: transactionDataToEstimate,
    from: safeAddress
  }
  try {
    const encodedResponse = await ethAdapter.call(transactionToEstimateGas)

    const safeTxGas = '0x' + encodedResponse.slice(-32)

    return safeTxGas

    // if the call throws an error we try to parse the returned value
  } catch (error: any) {
    try {
      const revertData = JSON.parse(error.error.body).error.data

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
  const simulateAndRevertResponse = ethAdapter.decodeParameters(
    ['bool', 'bytes'],
    encodedResponse
  )
  const returnedData = ethAdapter.decodeParameters(['uint256', 'bool', 'bytes'], simulateAndRevertResponse[1])
  */
function decodeSafeTxGas(encodedSafeTxGas: string): string {
  return Number('0x' + encodedSafeTxGas.slice(184).slice(0, 10)).toString()
}

function parseSafeTxGasErrorResponse(error: any) {
  // Ethers
  if (error?.error?.body) {
    const revertData = JSON.parse(error.error.body).error.data
    if (revertData && revertData.startsWith('Reverted ')) {
      const [, encodedResponse] = revertData.split('Reverted ')
      const safeTxGas = decodeSafeTxGas(encodedResponse)

      return safeTxGas
    }
  }

  // Web3
  const [, encodedResponse] = error.message.split('return data: ')
  const safeTxGas = decodeSafeTxGas(encodedResponse)

  return safeTxGas
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
  const safeVersion = await safe.getContractVersion()
  const ethAdapter = safe.getEthAdapter()
  const chainId = await safe.getChainId()
  const customContracts = safe.getContractManager().contractNetworks?.[chainId]
  const isL1SafeMasterCopy = safe.getContractManager().isL1SafeMasterCopy

  const safeSingletonContract = await getSafeContract({
    ethAdapter,
    safeVersion,
    isL1SafeMasterCopy,
    customContracts
  })

  // new version of the estimation
  const simulateTxAccessorContract = await getSimulateTxAccessorContract({
    ethAdapter,
    safeVersion,
    customContracts
  })

  const transactionDataToEstimate: string = simulateTxAccessorContract.encode('simulate', [
    safeTransaction.data.to,
    safeTransaction.data.value,
    safeTransaction.data.data,
    safeTransaction.data.operation
  ])

  // if the Safe is not deployed we can use the singleton address to simulate
  const to = isSafeDeployed ? safeAddress : safeSingletonContract.getAddress()

  const safeFunctionToEstimate: string = safeSingletonContract.encode('simulateAndRevert', [
    await simulateTxAccessorContract.getAddress(),
    transactionDataToEstimate
  ])

  const transactionToEstimateGas = {
    to,
    value: '0',
    data: safeFunctionToEstimate,
    from: safeAddress
  }

  try {
    const encodedResponse = await ethAdapter.call(transactionToEstimateGas)

    const safeTxGas = decodeSafeTxGas(encodedResponse)

    return safeTxGas

    // if the call throws an error we try to parse the returned value
  } catch (error: any) {
    return parseSafeTxGasErrorResponse(error)
  }

  return '0'
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

  const ethAdapter = safe.getEthAdapter()
  const safeDeploymentTransaction = await safe.createSafeDeploymentTransaction()

  const estimation = await ethAdapter.estimateGas({
    ...safeDeploymentTransaction,
    from: ZERO_ADDRESS // if we use the Safe address the estimation always fails due to CREATE2
  })

  return estimation
}
