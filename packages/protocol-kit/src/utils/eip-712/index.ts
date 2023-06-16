import {
  SafeTransactionTypedData,
  SafeMessageTypedData,
  SafeTransactionEIP712Args,
  SafeMessageEIP712Args,
  EIP712TypedData
} from '@safe-global/safe-core-sdk-types'
import { hashMessage, _TypedDataEncoder } from 'ethers/lib/utils'
import type { TypedDataDomain } from 'ethers'

import semverSatisfies from 'semver/functions/satisfies'

const EQ_OR_GT_1_3_0 = '>=1.3.0'

export const EIP712_DOMAIN_BEFORE_V130 = [
  {
    type: 'address',
    name: 'verifyingContract'
  }
]

export const EIP712_DOMAIN = [
  {
    type: 'uint256',
    name: 'chainId'
  },
  {
    type: 'address',
    name: 'verifyingContract'
  }
]

// This function returns the types structure for signing off-chain messages according to EIP-712
export function getEip712TransactionMessageTypes(safeVersion: string): {
  EIP712Domain: typeof EIP712_DOMAIN | typeof EIP712_DOMAIN_BEFORE_V130
  SafeTx: Array<{ type: string; name: string }>
} {
  const eip712WithChainId = semverSatisfies(safeVersion, EQ_OR_GT_1_3_0)
  return {
    EIP712Domain: eip712WithChainId ? EIP712_DOMAIN : EIP712_DOMAIN_BEFORE_V130,
    SafeTx: [
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'value' },
      { type: 'bytes', name: 'data' },
      { type: 'uint8', name: 'operation' },
      { type: 'uint256', name: 'safeTxGas' },
      { type: 'uint256', name: 'baseGas' },
      { type: 'uint256', name: 'gasPrice' },
      { type: 'address', name: 'gasToken' },
      { type: 'address', name: 'refundReceiver' },
      { type: 'uint256', name: 'nonce' }
    ]
  }
}

export function getEip712SafeMessageMessageTypes(safeVersion: string): {
  EIP712Domain: typeof EIP712_DOMAIN | typeof EIP712_DOMAIN_BEFORE_V130
  SafeMessage: [{ type: 'bytes'; name: 'message' }]
} {
  const eip712WithChainId = semverSatisfies(safeVersion, EQ_OR_GT_1_3_0)
  return {
    EIP712Domain: eip712WithChainId ? EIP712_DOMAIN : EIP712_DOMAIN_BEFORE_V130,
    SafeMessage: [{ type: 'bytes', name: 'message' }]
  }
}

export function generateTransactionTypedData({
  safeAddress,
  safeVersion,
  chainId,
  safeTransactionData
}: SafeTransactionEIP712Args): SafeTransactionTypedData {
  const eip712WithChainId = semverSatisfies(safeVersion, EQ_OR_GT_1_3_0)
  const typedData: SafeTransactionTypedData = {
    types: getEip712TransactionMessageTypes(safeVersion),
    domain: {
      verifyingContract: safeAddress
    },
    primaryType: 'SafeTx',
    message: {
      ...safeTransactionData,
      value: safeTransactionData.value,
      safeTxGas: safeTransactionData.safeTxGas,
      baseGas: safeTransactionData.baseGas,
      gasPrice: safeTransactionData.gasPrice,
      nonce: safeTransactionData.nonce
    }
  }
  if (eip712WithChainId) {
    typedData.domain.chainId = chainId
  }
  return typedData
}

export const hashTypedData = (typedData: EIP712TypedData): string => {
  // `ethers` doesn't require `EIP712Domain` and otherwise throws
  const { EIP712Domain: _, ...types } = typedData.types
  return _TypedDataEncoder.hash(typedData.domain as TypedDataDomain, types, typedData.message)
}

const hashSafeMessage = (message: string | EIP712TypedData): string => {
  return typeof message === 'string' ? hashMessage(message) : hashTypedData(message)
}

export function generateSafeMessageTypedData({
  safeAddress,
  safeVersion,
  chainId,
  message
}: SafeMessageEIP712Args): SafeMessageTypedData {
  const eip712WithChainId = semverSatisfies(safeVersion, EQ_OR_GT_1_3_0)
  const typedData: SafeMessageTypedData = {
    types: getEip712SafeMessageMessageTypes(safeVersion),
    domain: {
      verifyingContract: safeAddress
    },
    primaryType: 'SafeMessage',
    message: {
      message: hashSafeMessage(message)
    }
  }
  if (eip712WithChainId) {
    typedData.domain.chainId = chainId
  }
  return typedData
}
