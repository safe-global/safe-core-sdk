import { GenerateTypedData, SafeTransactionEIP712Args } from '@safe-global/safe-core-sdk-types'
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
export function getEip712MessageTypes(safeVersion: string): {
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

export function generateTypedData({
  safeAddress,
  safeVersion,
  chainId,
  safeTransactionData
}: SafeTransactionEIP712Args): GenerateTypedData {
  const eip712WithChainId = semverSatisfies(safeVersion, EQ_OR_GT_1_3_0)
  const typedData: GenerateTypedData = {
    types: getEip712MessageTypes(safeVersion),
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
