import { GnosisSafe } from '../../../typechain'
import { ZERO_ADDRESS } from '../constants'
import { estimateTxGas } from './gas'
import { OperationType, SafeTransactionData, SafeTransactionDataPartial } from './SafeTransaction'

export async function standardizeSafeTransaction(
  contract: GnosisSafe,
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
    nonce: tx.nonce ?? (await contract.nonce()).toNumber()
  }
  const safeTxGas =
    tx.safeTxGas ??
    (await estimateTxGas(
      contract,
      standardizedTxs.to,
      standardizedTxs.value,
      standardizedTxs.data,
      standardizedTxs.operation
    ))
  return {
    ...standardizedTxs,
    safeTxGas
  }
}
