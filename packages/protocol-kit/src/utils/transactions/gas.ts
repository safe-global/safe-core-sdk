import { BigNumber } from '@ethersproject/bignumber'
import {
  EthAdapter,
  GnosisSafeContract,
  OperationType,
  SafeTransactionDataPartial
} from '@safe-global/safe-core-sdk-types'
import { ZERO_ADDRESS } from '../constants'

const GAS_CALL_DATA_ZERO_BYTE = 4
const GAS_CALL_DATA_BYTE = 16 // 68 before Istanbul

function estimateDataGasCosts(data: string): number {
  const reducer = (accumulator: number, currentValue: string) => {
    if (currentValue === '0x') {
      return accumulator + 0
    }
    if (currentValue === '00') {
      return accumulator + GAS_CALL_DATA_ZERO_BYTE
    }
    return accumulator + GAS_CALL_DATA_BYTE
  }
  return (data.match(/.{2}/g) as string[]).reduce(reducer, 0)
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

export interface EstimateTxBaseGasProps extends SafeTransactionDataPartial {
  /** safeContract - The transaction or transaction array to process */
  safeContract: GnosisSafeContract
}

export async function estimateTxBaseGas({
  safeContract,
  to,
  value,
  data,
  operation,
  safeTxGas,
  gasToken,
  refundReceiver
}: EstimateTxBaseGasProps): Promise<number> {
  let baseGas = 0
  const threshold = await safeContract.getThreshold()
  const nonce = await safeContract.getNonce()

  // Every byte == 0 -> 4  Gas
  // Every byte != 0 -> 16 Gas (68 before Istanbul)
  // numbers < 256 (0x00(31*2)..ff) are 192 -> 31 * 4 + 1 * GAS_CALL_DATA_BYTE
  // numbers < 65535 (0x(30*2)..ffff) are 256 -> 30 * 4 + 2 * GAS_CALL_DATA_BYTE

  // Calculate gas for signatures
  // (array count (3 -> r, s, v) + ecrecover costs) * signature count
  // ecrecover for ecdsa ~= 4K gas, we use 6K
  const ECRECOVER_GAS = 6000
  const signatureGas =
    threshold * (1 * GAS_CALL_DATA_BYTE + 2 * 32 * GAS_CALL_DATA_BYTE + ECRECOVER_GAS)

  const encodeSafeTxGas = safeTxGas || 0
  const encodeBaseGas = 0
  const gasPrice = 1
  const encodeGasToken = gasToken || ZERO_ADDRESS
  const encodeRefundReceiver = refundReceiver || ZERO_ADDRESS
  const signatures = '0x'
  const estimateData: string = safeContract.encode('execTransaction', [
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
  let nonceGas = 5000
  if (nonce == 0) {
    nonceGas = 20000
  }

  // Keccak cost for the hash of the safe tx
  const HASH_GENERATION_GAS = 1500

  baseGas = signatureGas + estimateDataGasCosts(estimateData) + nonceGas + HASH_GENERATION_GAS

  // Add additional gas costs
  baseGas > 65536 ? (baseGas += 64) : (baseGas += 128)

  // Base tx costs, transfer costs...
  baseGas += 32000

  return baseGas
}
