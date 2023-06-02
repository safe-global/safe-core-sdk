import { BigNumber } from '@ethersproject/bignumber'
import {
  EthAdapter,
  GnosisSafeContract,
  OperationType,
  SafeTransactionDataPartial
} from '@safe-global/safe-core-sdk-types'
import { ZERO_ADDRESS } from '../constants'
import { getSafeContract } from '../../contracts/safeDeploymentContracts'
import Safe from '@safe-global/protocol-kit/Safe'

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

export async function estimateTxGas(
  safeContract: GnosisSafeContract,
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

export type EstimateTxBaseGasProps = {
  safe: Safe
  safeTransactionData: SafeTransactionDataPartial
}

export async function estimateTxBaseGas({
  safe,
  safeTransactionData
}: EstimateTxBaseGasProps): Promise<number> {
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

  const chainId = await safe.getChainId()

  const safeSingletonContract = await getSafeContract({
    ethAdapter: safe.getEthAdapter(),
    safeVersion: await safe.getContractVersion(),
    isL1SafeMasterCopy: safe.getContractManager().isL1SafeMasterCopy,
    customContracts: safe.getContractManager().contractNetworks?.[chainId]
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

  return baseGas
}
