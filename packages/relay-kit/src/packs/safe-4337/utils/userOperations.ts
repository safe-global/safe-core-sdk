import Safe from '@safe-global/protocol-kit'
import {
  MetaTransactionData,
  OperationType,
  UserOperation,
  UserOperationV07
} from '@safe-global/types-kit'
import { getSafeNonceFromEntrypoint, isEntryPointV6 } from './entrypoint'
import { encodeFunctionData, getAddress, Hex, hexToBytes, sliceHex, toHex } from 'viem'
import { ABI } from '../constants'
import { ERC20PaymasterOption, PaymasterOptions } from '../types'
import { encodeMultiSendCallData } from '../utils'

/**
 * Encode the UserOperation execution from a transaction.
 *
 * @param {MetaTransactionData} transaction - The transaction data to encode.
 * @return {string} The encoded call data string.
 */
function encodeExecuteUserOpCallData(transaction: MetaTransactionData): string {
  return encodeFunctionData({
    abi: ABI,
    functionName: 'executeUserOp',
    args: [
      transaction.to,
      BigInt(transaction.value),
      transaction.data as Hex,
      transaction.operation || OperationType.Call
    ]
  })
}

async function getCallData(
  protocolKit: Safe,
  transactions: MetaTransactionData[],
  paymasterOptions: ERC20PaymasterOption,
  amountToApprove?: bigint
): Promise<string> {
  if (amountToApprove) {
    const approveToPaymasterTransaction = {
      to: paymasterOptions.paymasterTokenAddress,
      data: encodeFunctionData({
        abi: ABI,
        functionName: 'approve',
        args: [paymasterOptions.paymasterAddress, amountToApprove]
      }),
      value: '0',
      operation: OperationType.Call // Call for approve
    }

    transactions.push(approveToPaymasterTransaction)
  }

  const isBatch = transactions.length > 1
  const multiSendAddress = protocolKit.getMultiSendAddress()

  const callData = isBatch
    ? encodeExecuteUserOpCallData({
        to: multiSendAddress,
        value: '0',
        data: encodeMultiSendCallData(transactions),
        operation: OperationType.DelegateCall
      })
    : encodeExecuteUserOpCallData(transactions[0])

  return callData
}

function unpackInitCode(initCode: string): Pick<UserOperationV07, 'factory' | 'factoryData'> {
  const initCodeBytes = hexToBytes(initCode as Hex)

  return initCodeBytes.length > 0
    ? {
        factory: getAddress(sliceHex(initCode as Hex, 0, 20)),
        factoryData: sliceHex(initCode as Hex, 20)
      }
    : {}
}

export async function createUserOperation(
  protocolKit: Safe,
  transactions: MetaTransactionData[],
  {
    amountToApprove,
    entryPoint,
    paymasterOptions
  }: { entryPoint: string; amountToApprove?: bigint; paymasterOptions: PaymasterOptions }
): Promise<UserOperation> {
  const safeAddress = await protocolKit.getAddress()
  const nonce = await getSafeNonceFromEntrypoint(protocolKit, safeAddress, entryPoint)
  const isSafeDeployed = await protocolKit.isSafeDeployed()
  const paymasterAndData =
    paymasterOptions && 'paymasterAddress' in paymasterOptions
      ? paymasterOptions.paymasterAddress
      : '0x'
  const callData = await getCallData(
    protocolKit,
    transactions,
    paymasterOptions as ERC20PaymasterOption,
    amountToApprove
  )
  const initCode = isSafeDeployed ? '0x' : await protocolKit.getInitCode()

  if (isEntryPointV6(entryPoint)) {
    return {
      sender: safeAddress,
      nonce: toHex(nonce),
      initCode,
      callData,
      callGasLimit: 1n,
      verificationGasLimit: 1n,
      preVerificationGas: 1n,
      maxFeePerGas: 1n,
      maxPriorityFeePerGas: 1n,
      paymasterAndData,
      signature: '0x'
    }
  }

  return {
    sender: safeAddress,
    nonce: toHex(nonce),
    ...unpackInitCode(initCode),
    callData,
    callGasLimit: 1n,
    verificationGasLimit: 1n,
    preVerificationGas: 1n,
    maxFeePerGas: 1n,
    maxPriorityFeePerGas: 1n,
    paymaster: paymasterAndData,
    paymasterData: '0x',
    paymasterVerificationGasLimit: undefined,
    paymasterPostOpGasLimit: undefined,
    signature: '0x'
  }
}
