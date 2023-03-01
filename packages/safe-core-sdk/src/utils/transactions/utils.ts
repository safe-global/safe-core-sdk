import { arrayify } from '@ethersproject/bytes'
import { pack as solidityPack } from '@ethersproject/solidity'
import { BigNumber, ethers } from 'ethers'
import {
  EthAdapter,
  GnosisSafeContract,
  MetaTransactionData,
  OperationType,
  SafeTransactionData,
  SafeTransactionDataPartial
} from '@safe-global/safe-core-sdk-types'
import { SAFE_FEATURES, hasSafeFeature } from '@safe-global/safe-core-sdk-utils'
import { ZERO_ADDRESS } from '../constants'
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
  if (
    // hasSafeFeature(SAFE_FEATURES.SAFE_TX_GAS_OPTIONAL, safeVersion) &&
    standardizedTxs.gasPrice === 0
  ) {
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

export function decodeMultiSendData(data: string): MetaTransactionData[] {
  // uint8 operation, address to, value uint265, dataLength uint256
  const INDIVIDUAL_TX_DATA_LENGTH = 2 + 40 + 64 + 64

  const multiSendInterface = new ethers.utils.Interface([
    'function multiSend(bytes memory transactions) public payable'
  ])
  const [decodedData] = multiSendInterface.decodeFunctionData('multiSend', data)

  const abiCoder = new ethers.utils.AbiCoder()

  const txs: MetaTransactionData[] = []

  // Decode after 0x
  let index = 2

  while (index < decodedData.length) {
    const txDataEncoded = `0x${decodedData.slice(
      index,
      // Traverse next transaction
      (index += INDIVIDUAL_TX_DATA_LENGTH)
    )}`

    const [txOperation, txTo, txValue, txDataBytesLength] = abiCoder.decode(
      ['uint8', 'address', 'uint256', 'uint256'],
      ethers.utils.hexZeroPad(txDataEncoded, 32 * 4)
    )

    // Each byte is represented by two characters
    const dataLength = (txDataBytesLength as BigNumber).toNumber() * 2
    const txData = `0x${decodedData.slice(
      index,
      // Traverse data length
      (index += dataLength)
    )}`

    txs.push({
      operation: txOperation as OperationType,
      to: txTo,
      value: (txValue as BigNumber).toString(),
      data: txData
    })
  }

  return txs
}
