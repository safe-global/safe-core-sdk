import { ZERO_ADDRESS } from '../constants'
import { estimateTxGas } from './gasEstimation'
import { OperationType, SafeTransactionData, SafeTransactionDataPartial } from './SafeTransaction'

export async function standardizeSafeTransaction(
  contract: any,
  tx: SafeTransactionDataPartial
): Promise<SafeTransactionData> {
  let safeTxGas = 0
  if (!tx.safeTxGas) {
    try {
      safeTxGas = await estimateTxGas(
        contract,
        contract.address,
        tx.data,
        tx.to,
        tx.value,
        tx.operation ?? OperationType.Call
      )
    } catch (error) {
      console.log(error)
    }
  }
  const nonce = tx.nonce ?? (await contract.nonce()).toNumber()
  return {
    to: tx.to,
    value: tx.value,
    data: tx.data,
    operation: tx.operation ?? OperationType.Call,
    safeTxGas,
    baseGas: tx.baseGas ?? 0,
    gasPrice: tx.gasPrice ?? 0,
    gasToken: tx.gasToken || ZERO_ADDRESS,
    refundReceiver: tx.refundReceiver || ZERO_ADDRESS,
    nonce
  }
}
