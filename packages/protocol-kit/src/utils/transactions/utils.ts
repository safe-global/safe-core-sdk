import { ethers, Interface, getBytes, solidityPacked as solidityPack } from 'ethers'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { DEFAULT_SAFE_VERSION } from '@safe-global/protocol-kit/contracts/config'
import {
  AddOwnerTxParams,
  AddPasskeyOwnerTxParams,
  StandardizeSafeTransactionDataProps
} from '@safe-global/protocol-kit/types'
import { hasSafeFeature, SAFE_FEATURES } from '@safe-global/protocol-kit/utils'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import {
  MetaTransactionData,
  OperationType,
  SafeMultisigTransactionResponse,
  SafeTransaction,
  SafeTransactionData,
  SafeTransactionDataPartial,
  SafeVersion
} from '@safe-global/safe-core-sdk-types'
import semverSatisfies from 'semver/functions/satisfies'
import { estimateGas, estimateTxGas } from './gas'

export function standardizeMetaTransactionData(
  tx: SafeTransactionDataPartial
): MetaTransactionData {
  const standardizedTxs: MetaTransactionData = {
    ...tx,
    operation: tx.operation ?? OperationType.Call
  }
  return standardizedTxs
}

export async function standardizeSafeTransactionData({
  safeContract,
  predictedSafe,
  provider,
  tx,
  contractNetworks
}: StandardizeSafeTransactionDataProps): Promise<SafeTransactionData> {
  const standardizedTxs = {
    to: tx.to,
    value: tx.value,
    data: tx.data,
    operation: tx.operation ?? OperationType.Call,
    baseGas: tx.baseGas ?? '0',
    gasPrice: tx.gasPrice ?? '0',
    gasToken: tx.gasToken || ZERO_ADDRESS,
    refundReceiver: tx.refundReceiver || ZERO_ADDRESS,
    nonce: tx.nonce ?? (safeContract ? Number(await safeContract.getNonce()) : 0)
  }

  if (typeof tx.safeTxGas !== 'undefined') {
    return {
      ...standardizedTxs,
      safeTxGas: tx.safeTxGas
    }
  }

  let safeVersion: SafeVersion
  if (predictedSafe) {
    safeVersion = predictedSafe?.safeDeploymentConfig?.safeVersion || DEFAULT_SAFE_VERSION
  } else {
    if (!safeContract) {
      throw new Error('Safe is not deployed')
    }
    safeVersion = await safeContract.getVersion()
  }

  const hasSafeTxGasOptional = hasSafeFeature(SAFE_FEATURES.SAFE_TX_GAS_OPTIONAL, safeVersion)
  if (
    (hasSafeTxGasOptional && standardizedTxs.gasPrice === '0') ||
    (hasSafeTxGasOptional && predictedSafe)
  ) {
    return {
      ...standardizedTxs,
      safeTxGas: '0'
    }
  }

  if (!safeContract) {
    throw new Error('Safe is not deployed')
  }

  let safeTxGas

  const safeProvider = new SafeProvider({ provider })
  if (semverSatisfies(safeVersion, '>=1.3.0')) {
    safeTxGas = await estimateGas(
      safeVersion,
      safeContract,
      safeProvider,
      standardizedTxs.to,
      standardizedTxs.value,
      standardizedTxs.data,
      standardizedTxs.operation,
      contractNetworks
    )
  } else {
    safeTxGas = await estimateTxGas(
      safeContract,
      safeProvider,
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
  const data = getBytes(tx.data)
  const encoded = solidityPack(
    ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
    [tx.operation, tx.to, tx.value, data.length, data]
  )
  return encoded.slice(2)
}

export function encodeMultiSendData(txs: MetaTransactionData[]): string {
  return '0x' + txs.map((tx) => encodeMetaTransaction(tx)).join('')
}

export function decodeMultiSendData(encodedData: string): MetaTransactionData[] {
  const multiSendInterface = new Interface([
    'function multiSend(bytes memory transactions) public payable'
  ])
  const [decodedData] = multiSendInterface.decodeFunctionData('multiSend', encodedData)

  const txs: MetaTransactionData[] = []

  // Decode after 0x
  let index = 2

  while (index < decodedData.length) {
    // As we are decoding hex encoded bytes calldata, each byte is represented by 2 chars
    // uint8 operation, address to, value uint256, dataLength uint256

    const operation = `0x${decodedData.slice(index, (index += 2))}`
    const to = `0x${decodedData.slice(index, (index += 40))}`
    const value = `0x${decodedData.slice(index, (index += 64))}`
    const dataLength = parseInt(decodedData.slice(index, (index += 64)), 16) * 2
    const data = `0x${decodedData.slice(index, (index += dataLength))}`

    txs.push({
      operation: Number(operation) as OperationType,
      to: ethers.getAddress(to),
      value: BigInt(value).toString(),
      data
    })
  }

  return txs
}

export function isSafeMultisigTransactionResponse(
  safeTransaction: SafeTransaction | SafeMultisigTransactionResponse
): safeTransaction is SafeMultisigTransactionResponse {
  return (safeTransaction as SafeMultisigTransactionResponse).isExecuted !== undefined
}

export function isAddOwnerTxParams(
  params: AddOwnerTxParams | AddPasskeyOwnerTxParams
): params is AddOwnerTxParams {
  return (params as AddOwnerTxParams).ownerAddress !== undefined
}

export function isAddPasskeyOwnerTxParams(
  params: AddOwnerTxParams | AddPasskeyOwnerTxParams
): params is AddPasskeyOwnerTxParams {
  return (params as AddPasskeyOwnerTxParams).passkey !== undefined
}
