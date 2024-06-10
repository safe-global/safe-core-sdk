export type SafeVersion = '1.4.1' | '1.3.0' | '1.2.0' | '1.1.1' | '1.0.0'

export enum OperationType {
  Call, // 0
  DelegateCall // 1
}

export interface CreateProxyProps {
  safeSingletonAddress: string
  initializer: string
  saltNonce: string
  options?: TransactionOptions
  callback?: (txHash: string) => void
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
  readonly isContractSignature: boolean
  staticPart(dynamicOffset?: string): string
  dynamicPart(): string
}

export interface SafeTransaction {
  readonly data: SafeTransactionData
  readonly signatures: Map<string, SafeSignature>
  getSignature(signer: string): SafeSignature | undefined
  addSignature(signature: SafeSignature): void
  encodedSignatures(): string
}

export interface SafeMessage {
  readonly data: EIP712TypedData | string
  readonly signatures: Map<string, SafeSignature>
  getSignature(signer: string): SafeSignature | undefined
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
  transactionResponse: unknown
  options?: TransactionOptions
}

export interface Eip3770Address {
  prefix: string
  address: string
}

export interface SafeEIP712Args {
  safeAddress: string
  safeVersion: string
  chainId: bigint
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
    chainId?: string
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
  readonly proposer: string
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
  chainId: bigint
  options?: MetaTransactionOptions
}

export interface MetaTransactionOptions {
  gasLimit?: string
  gasToken?: string
  isSponsored?: boolean
}

export type UserOperation = {
  sender: string
  nonce: string
  initCode: string
  callData: string
  callGasLimit: bigint
  verificationGasLimit: bigint
  preVerificationGas: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  paymasterAndData: string
  signature: string
}

export type SafeUserOperation = {
  safe: string
  nonce: bigint
  initCode: string
  callData: string
  callGasLimit: bigint
  verificationGasLimit: bigint
  preVerificationGas: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  paymasterAndData: string
  validAfter: number
  validUntil: number
  entryPoint: string
}

export type EstimateGasData = {
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  preVerificationGas?: bigint
  verificationGasLimit?: bigint
  callGasLimit?: bigint
}

export interface SafeOperation {
  readonly moduleAddress: string
  readonly data: SafeUserOperation
  readonly signatures: Map<string, SafeSignature>
  getSignature(signer: string): SafeSignature | undefined
  addSignature(signature: SafeSignature): void
  encodedSignatures(): string
  addEstimations(estimations: EstimateGasData): void
  toUserOperation(): UserOperation
}

export const isSafeOperation = (response: unknown): response is SafeOperation => {
  const safeOperation = response as SafeOperation

  return 'data' in safeOperation && 'signatures' in safeOperation
}

export type SafeOperationConfirmation = {
  readonly created: string
  readonly modified: string
  readonly owner: string
  readonly signature: string
  readonly signatureType: string
}

export type UserOperationResponse = {
  readonly ethereumTxHash: null | string
  readonly sender: string
  readonly userOperationHash: string
  readonly nonce: number
  readonly initCode: null | string
  readonly callData: null | string
  readonly callGasLimit: number
  readonly verificationGasLimit: number
  readonly preVerificationGas: number
  readonly maxFeePerGas: number
  readonly maxPriorityFeePerGas: number
  readonly paymaster: null | string
  readonly paymasterData: null | string
  readonly signature: string
  readonly entryPoint: string
}

export type SafeOperationResponse = {
  readonly created: string
  readonly modified: string
  readonly safeOperationHash: string
  readonly validAfter: null | string
  readonly validUntil: null | string
  readonly moduleAddress: string
  readonly confirmations?: Array<SafeOperationConfirmation>
  readonly preparedSignature?: string
  readonly userOperation?: UserOperationResponse
}

export const isSafeOperationResponse = (response: unknown): response is SafeOperationResponse => {
  const safeOperationResponse = response as SafeOperationResponse

  return 'userOperation' in safeOperationResponse && 'safeOperationHash' in safeOperationResponse
}
