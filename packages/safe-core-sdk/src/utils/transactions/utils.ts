import { arrayify } from '@ethersproject/bytes'
import { pack as solidityPack } from '@ethersproject/solidity'
import {
  EthAdapter,
  GnosisSafeContract,
  MetaTransactionData,
  OperationType,
  SafeTransactionData,
  SafeTransactionDataPartial
} from '@safe-global/safe-core-sdk-types'
import { ZERO_ADDRESS } from '../constants'
import { FEATURES, hasFeature } from '../safeVersions'
import { estimateTxGas } from './gas'

export function standardizeMetaTransactionData(
  tx: SafeTransactionDataPartial
): MetaTransactionData {
  const standardizedTxs: MetaTransactionData = {
    ...tx,
    operation: tx.operation ?? OperationType.Call
  }
  return standardizedTxs
}

export async function standardizeSafeTransactionData(
  safeContract: GnosisSafeContract,
  ethAdapter: EthAdapter,
  tx: SafeTransactionDataPartial
): Promise<SafeTransactionData> {
  const standardizedTxs = {
    to: tx.to,
    value: tx.value,
    data: tx.data,
    operation: tx.operation ?? OperationType.Call,
    baseGas: tx.baseGas ?? 0,
    gasPrice: tx.gasPrice ?? 0,
    gasToken: tx.gasToken || ZERO_ADDRESS,
    refundReceiver: tx.refundReceiver || ZERO_ADDRESS,
    nonce: tx.nonce ?? (await safeContract.getNonce())
  }
  let safeTxGas: number

  if (typeof tx.safeTxGas !== 'undefined') {
    return {
      ...standardizedTxs,
      safeTxGas: tx.safeTxGas
    }
  }
  const safeVersion = await safeContract.getVersion()
  if (hasFeature(FEATURES.SAFE_TX_GAS_OPTIONAL, safeVersion) && standardizedTxs.gasPrice === 0) {
    safeTxGas = 0
  } else {
    safeTxGas = await estimateTxGas(
      safeContract,
      ethAdapter,
      standardizedTxs.to,
      standardizedTxs.value,
      standardizedTxs.data,
      standardizedTxs.operation
    )
  }
  return {
    ...standardizedTxs,
    safeTxGas
  }
}

function encodeMetaTransaction(tx: MetaTransactionData): string {
  const data = arrayify(tx.data)
  const encoded = solidityPack(
    ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
    [tx.operation, tx.to, tx.value, data.length, data]
  )
  return encoded.slice(2)
}

export function encodeMultiSendData(txs: MetaTransactionData[]): string {
  return '0x' + txs.map((tx) => encodeMetaTransaction(tx)).join('')
}
