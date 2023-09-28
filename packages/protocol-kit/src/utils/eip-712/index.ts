import {
  EIP712MessageTypes,
  EIP712TxTypes,
  EIP712TypedData,
  SafeEIP712Args
} from '@safe-global/safe-core-sdk-types'
import semverSatisfies from 'semver/functions/satisfies'
import { _TypedDataEncoder, hashMessage } from 'ethers/lib/utils'

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
export function getEip712TxTypes(safeVersion: string): EIP712TxTypes {
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

export function getEip712MessageTypes(safeVersion: string): EIP712MessageTypes {
  const eip712WithChainId = semverSatisfies(safeVersion, EQ_OR_GT_1_3_0)
  return {
    EIP712Domain: eip712WithChainId ? EIP712_DOMAIN : EIP712_DOMAIN_BEFORE_V130,
    SafeMessage: [{ type: 'bytes', name: 'message' }]
  }
}

export const hashTypedData = (typedData: EIP712TypedData): string => {
  // `ethers` doesn't require `EIP712Domain` and otherwise throws
  const { EIP712Domain: _, ...types } = typedData.types
  return _TypedDataEncoder.hash(typedData.domain, types, typedData.message)
}

export function generateTypedData({
  safeAddress,
  safeVersion,
  chainId,
  data
}: SafeEIP712Args): EIP712TypedData {
  const isMessage = typeof data === 'string'
  const eip712WithChainId = semverSatisfies(safeVersion, EQ_OR_GT_1_3_0)

  let typedData: EIP712TypedData

  if (isMessage) {
    typedData = {
      types: getEip712MessageTypes(safeVersion),
      domain: {
        verifyingContract: safeAddress
      },
      primaryType: 'SafeMessage',
      message: { message: data }
    }
  } else {
    typedData = {
      types: getEip712TxTypes(safeVersion),
      domain: {
        verifyingContract: safeAddress
      },
      primaryType: 'SafeTx',
      message: {
        ...data,
        value: data.value,
        safeTxGas: data.safeTxGas,
        baseGas: data.baseGas,
        gasPrice: data.gasPrice,
        nonce: data.nonce
      }
    }
  }

  if (eip712WithChainId) {
    typedData.domain.chainId = chainId
  }

  return typedData
}
