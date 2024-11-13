import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { DEFAULT_SAFE_VERSION } from '@safe-global/protocol-kit/contracts/config'
import {
  AddOwnerTxParams,
  AddPasskeyOwnerTxParams,
  PasskeyArgType,
  RemoveOwnerTxParams,
  RemovePasskeyOwnerTxParams,
  SafeProviderTransaction,
  StandardizeSafeTransactionDataProps,
  SwapOwnerTxParams,
  ExternalClient
} from '@safe-global/protocol-kit/types'
import { hasSafeFeature, SAFE_FEATURES } from '@safe-global/protocol-kit/utils'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import { asHex } from '../types'
import {
  MetaTransactionData,
  OperationType,
  SafeMultisigTransactionResponse,
  SafeTransaction,
  SafeTransactionData,
  SafeTransactionDataPartial,
  SafeVersion,
  TransactionOptions,
  Transaction
} from '@safe-global/types-kit'
import semverSatisfies from 'semver/functions/satisfies'
import { estimateGas, estimateTxGas } from './gas'
import {
  Hash,
  EstimateGasParameters,
  TransactionRequest,
  UnionOmit,
  toBytes,
  getAddress,
  encodePacked,
  bytesToHex,
  decodeFunctionData,
  parseAbi
} from 'viem'
import { waitForTransactionReceipt as waitForTransactionReceiptViem } from 'viem/actions'
import { WalletLegacyTransactionOptions, WalletTransactionOptions } from './types'

export function standardizeMetaTransactionData(
  tx: SafeTransactionDataPartial
): MetaTransactionData {
  const standardizedTxs: MetaTransactionData = {
    ...tx,
    operation: tx.operation ?? OperationType.Call
  }
  return standardizedTxs
}

export function waitForTransactionReceipt(client: ExternalClient, hash: Hash) {
  return waitForTransactionReceiptViem(client, { hash })
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
    safeVersion = safeContract.safeVersion
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
  const data = toBytes(tx.data)
  const encoded = encodePacked(
    ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
    [
      tx.operation ?? OperationType.Call,
      tx.to,
      BigInt(tx.value),
      BigInt(data.length),
      bytesToHex(data)
    ]
  )
  return encoded.slice(2)
}

export function encodeMultiSendData(txs: MetaTransactionData[]): string {
  return `0x${txs.map((tx) => encodeMetaTransaction(tx)).join('')}`
}

export function decodeMultiSendData(encodedData: string): MetaTransactionData[] {
  const decodedData = decodeFunctionData({
    abi: parseAbi(['function multiSend(bytes memory transactions) public payable']),
    data: asHex(encodedData)
  })

  const args = decodedData.args
  const txs: MetaTransactionData[] = []

  // Decode after 0x
  let index = 2

  if (args) {
    const [transactionBytes] = args
    while (index < transactionBytes.length) {
      // As we are decoding hex encoded bytes calldata, each byte is represented by 2 chars
      // uint8 operation, address to, value uint256, dataLength uint256

      const operation = `0x${transactionBytes.slice(index, (index += 2))}`
      const to = `0x${transactionBytes.slice(index, (index += 40))}`
      const value = `0x${transactionBytes.slice(index, (index += 64))}`
      const dataLength = parseInt(`${transactionBytes.slice(index, (index += 64))}`, 16) * 2
      const data = `0x${transactionBytes.slice(index, (index += dataLength))}`

      txs.push({
        operation: Number(operation) as OperationType,
        to: getAddress(to),
        value: BigInt(value).toString(),
        data
      })
    }
  }

  return txs
}

export function isSafeMultisigTransactionResponse(
  safeTransaction: SafeTransaction | SafeMultisigTransactionResponse
): safeTransaction is SafeMultisigTransactionResponse {
  return (safeTransaction as SafeMultisigTransactionResponse).isExecuted !== undefined
}

type PasskeyParam = { passkey: PasskeyArgType }

export function isPasskeyParam(
  params:
    | AddOwnerTxParams
    | AddPasskeyOwnerTxParams
    | RemoveOwnerTxParams
    | RemovePasskeyOwnerTxParams
): params is PasskeyParam {
  return (params as PasskeyParam).passkey !== undefined
}

export function isOldOwnerPasskey(
  params: SwapOwnerTxParams
): params is SwapOwnerTxParams & { oldOwnerPasskey: PasskeyArgType } {
  return (params as { oldOwnerPasskey: PasskeyArgType }).oldOwnerPasskey !== undefined
}

export function isNewOwnerPasskey(
  params: SwapOwnerTxParams
): params is SwapOwnerTxParams & { newOwnerPasskey: PasskeyArgType } {
  return (params as { newOwnerPasskey: PasskeyArgType }).newOwnerPasskey !== undefined
}

export function toEstimateGasParameters(tx: SafeProviderTransaction): EstimateGasParameters {
  const params: EstimateGasParameters = isLegacyTransaction(tx)
    ? createLegacyTxOptions(tx)
    : createTxOptions(tx)
  if (tx.value) {
    params.value = BigInt(tx.value)
  }

  if (tx.to) {
    params.to = tx.to
  }

  if (tx.data) {
    params.data = asHex(tx.data)
  }

  return params
}

export function toTransactionRequest(
  tx: SafeProviderTransaction | Transaction
): UnionOmit<TransactionRequest, 'from'> {
  const params: UnionOmit<TransactionRequest, 'from'> = isLegacyTransaction(tx)
    ? createLegacyTxOptions(tx)
    : createTxOptions(tx)

  if (tx.to) {
    params.to = tx.to
  }

  if (tx.data) {
    params.data = asHex(tx.data)
  }

  return params
}

export function convertTransactionOptions(
  options?: TransactionOptions
): Partial<WalletLegacyTransactionOptions | WalletTransactionOptions> {
  return isLegacyTransaction(options) ? createLegacyTxOptions(options) : createTxOptions(options)
}

export function isLegacyTransaction(options?: TransactionOptions) {
  return !!options?.gasPrice
}

export function createLegacyTxOptions(
  options?: TransactionOptions
): Partial<WalletLegacyTransactionOptions> {
  const converted: Partial<WalletLegacyTransactionOptions> = {}
  if (options?.from) {
    converted.account = options.from
  }

  if (options?.gasLimit) {
    converted.gas = BigInt(options.gasLimit)
  }

  if (options?.gasPrice) {
    converted.gasPrice = BigInt(options.gasPrice)
  }

  if (options?.nonce) {
    converted.nonce = options.nonce
  }

  return converted
}

export function createTxOptions(options?: TransactionOptions): Partial<WalletTransactionOptions> {
  const converted: Partial<WalletTransactionOptions> = {}
  if (options?.from) {
    converted.account = options.from
  }

  if (options?.gasLimit) {
    converted.gas = BigInt(options.gasLimit)
  }

  if (options?.maxFeePerGas) {
    converted.maxFeePerGas = BigInt(options.maxFeePerGas)
  }

  if (options?.maxPriorityFeePerGas) {
    converted.maxPriorityFeePerGas = BigInt(options.maxPriorityFeePerGas)
  }

  if (options?.nonce) {
    converted.nonce = options.nonce
  }

  return converted
}
