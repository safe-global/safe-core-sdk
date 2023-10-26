import { ContractTransactionResponse } from 'ethers'
import { PromiEvent, TransactionReceipt } from 'web3-core/types'

export type SafeVersion = '1.4.1' | '1.3.0' | '1.2.0' | '1.1.1' | '1.0.0'

export enum OperationType {
  Call, // 0
  DelegateCall // 1
}

export interface SafeSetupConfig {
  owners: string[]
  threshold: number
  to?: string
  data?: string
  fallbackHandler?: string
  paymentToken?: string
  payment?: string
  paymentReceiver?: string
}
export interface MetaTransactionData {
  to: string
  value: string
  data: string
  operation?: OperationType
}

export interface SafeTransactionData extends MetaTransactionData {
  operation: OperationType
  safeTxGas: string
  baseGas: string
  gasPrice: string
  gasToken: string
  refundReceiver: string
  nonce: number
}

export interface SafeTransactionDataPartial extends MetaTransactionData {
  safeTxGas?: string
  baseGas?: string
  gasPrice?: string
  gasToken?: string
  refundReceiver?: string
  nonce?: number
}

export interface SafeSignature {
  readonly signer: string
  readonly data: string
  readonly isSmartContractSignature: boolean
  staticPart(dynamicOffset?: string): string
  dynamicPart(): string
}

export interface SafeTransaction {
  readonly data: SafeTransactionData
  readonly signatures: Map<string, SafeSignature>
  addSignature(signature: SafeSignature): void
  encodedSignatures(): string
}

export type Transaction = TransactionBase & TransactionOptions

interface TransactionBase {
  to: string
  value: string
  data: string
}

export interface TransactionOptions {
  from?: string
  gas?: number | string
  gasLimit?: number | string
  gasPrice?: number | string
  maxFeePerGas?: number | string
  maxPriorityFeePerGas?: number | string
  nonce?: number
}

export interface BaseTransactionResult {
  hash: string
}

export interface TransactionResult extends BaseTransactionResult {
  promiEvent?: PromiEvent<TransactionReceipt>
  transactionResponse?: ContractTransactionResponse
  options?: TransactionOptions
}

export interface Eip3770Address {
  prefix: string
  address: string
}

export interface SafeEIP712Args {
  safeAddress: string
  safeVersion: string
  chainId: number
  data: SafeTransactionData | EIP712TypedData | string
}

export interface EIP712TxTypes {
  EIP712Domain: {
    type: string
    name: string
  }[]
  SafeTx: {
    type: string
    name: string
  }[]
}

export interface EIP712MessageTypes {
  EIP712Domain: {
    type: string
    name: string
  }[]
  SafeMessage: [
    {
      type: 'bytes'
      name: 'message'
    }
  ]
}

export type EIP712Types = EIP712TxTypes | EIP712MessageTypes

export interface EIP712TypedDataTx {
  types: EIP712TxTypes
  domain: {
    chainId?: number
    verifyingContract: string
  }
  primaryType: 'SafeTx'
  message: {
    to: string
    value: string
    data: string
    operation: OperationType
    safeTxGas: string
    baseGas: string
    gasPrice: string
    gasToken: string
    refundReceiver: string
    nonce: number
  }
}

export interface EIP712TypedDataMessage {
  types: EIP712MessageTypes
  domain: {
    chainId?: number
    verifyingContract: string
  }
  primaryType: 'SafeMessage'
  message: {
    message: string
  }
}

interface TypedDataDomain {
  name?: string
  version?: string
  chainId?: unknown
  verifyingContract?: string
  salt?: ArrayLike<number> | string
}

interface TypedDataTypes {
  name: string
  type: string
}

type TypedMessageTypes = {
  [key: string]: TypedDataTypes[]
}

export interface EIP712TypedData {
  domain: TypedDataDomain
  types: TypedMessageTypes
  message: Record<string, unknown>
  primaryType?: string
}

export type SafeMultisigConfirmationResponse = {
  readonly owner: string
  readonly submissionDate: string
  readonly transactionHash?: string
  readonly confirmationType?: string
  readonly signature: string
  readonly signatureType?: string
}

export type SafeMultisigConfirmationListResponse = {
  readonly count: number
  readonly next?: string
  readonly previous?: string
  readonly results: SafeMultisigConfirmationResponse[]
}

export type SafeMultisigTransactionResponse = {
  readonly safe: string
  readonly to: string
  readonly value: string
  readonly data?: string
  readonly operation: number
  readonly gasToken: string
  readonly safeTxGas: number
  readonly baseGas: number
  readonly gasPrice: string
  readonly refundReceiver?: string
  readonly nonce: number
  readonly executionDate: string
  readonly submissionDate: string
  readonly modified: string
  readonly blockNumber?: number
  readonly transactionHash: string
  readonly safeTxHash: string
  readonly executor?: string
  readonly isExecuted: boolean
  readonly isSuccessful?: boolean
  readonly ethGasPrice?: string
  readonly gasUsed?: number
  readonly fee?: string
  readonly origin: string
  readonly dataDecoded?: string
  readonly confirmationsRequired: number
  readonly confirmations?: SafeMultisigConfirmationResponse[]
  readonly trusted: boolean
  readonly signatures?: string
}

export interface RelayTransaction {
  target: string
  encodedTransaction: string
  chainId: number
  options?: MetaTransactionOptions
}

export interface MetaTransactionOptions {
  gasLimit?: string
  gasToken?: string
  isSponsored?: boolean
}
