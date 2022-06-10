import { BigNumber } from '@ethersproject/bignumber'
import { GenerateTypedData, SafeTransactionEIP712Args } from '@gnosis.pm/safe-core-sdk-types'
import semverSatisfies from 'semver/functions/satisfies'

const EIP712_DOMAIN_BEFORE_V130 = [
  {
    type: 'address',
    name: 'verifyingContract'
  }
]

const EIP712_DOMAIN = [
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
function getEip712MessageTypes(safeVersion: string): {
  EIP712Domain: typeof EIP712_DOMAIN | typeof EIP712_DOMAIN_BEFORE_V130
  SafeTx: Array<{ type: string; name: string }>
} {
  const eip712WithChainId = semverSatisfies(safeVersion, '>=1.3.0')
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
  const eip712WithChainId = semverSatisfies(safeVersion, '>=1.3.0')
  const typedData: GenerateTypedData = {
    types: getEip712MessageTypes(safeVersion),
    domain: {
      chainId: eip712WithChainId ? chainId : undefined,
      verifyingContract: safeAddress
    },
    primaryType: 'SafeTx',
    message: {
      ...safeTransactionData,
      value: BigNumber.from(safeTransactionData.value),
      safeTxGas: BigNumber.from(safeTransactionData.safeTxGas),
      baseGas: BigNumber.from(safeTransactionData.baseGas),
      gasPrice: BigNumber.from(safeTransactionData.gasPrice),
      nonce: BigNumber.from(safeTransactionData.nonce)
    }
  }
  return typedData
}
