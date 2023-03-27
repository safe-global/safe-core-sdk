import { arrayify } from '@ethersproject/bytes'
import { pack as solidityPack } from '@ethersproject/solidity'
import { PREDETERMINED_SALT_NONCE } from '@safe-global/protocol-kit'
import {
  GnosisSafeContract,
  GnosisSafeProxyFactoryContract,
  MetaTransactionData,
  SafeTransactionData
} from '@safe-global/safe-core-sdk-types'

export function encodeCreateProxyWithNonce(
  safeProxyFactoryContract: GnosisSafeProxyFactoryContract,
  safeSingletonAddress: string,
  initializer: string
) {
  return safeProxyFactoryContract.encode('createProxyWithNonce', [
    safeSingletonAddress,
    initializer,
    PREDETERMINED_SALT_NONCE
  ])
}

export function encodeExecTransaction(
  safeContract: GnosisSafeContract,
  transaction: SafeTransactionData,
  signature: string
): string {
  return safeContract.encode('execTransaction', [
    transaction.to,
    transaction.value,
    transaction.data,
    transaction.operation,
    transaction.safeTxGas,
    transaction.baseGas,
    transaction.gasPrice,
    transaction.gasToken,
    transaction.refundReceiver,
    signature
  ])
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
