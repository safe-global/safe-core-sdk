import { TransactionOptions, TransactionResult } from '@safe-global/safe-core-sdk-types/types'

export interface SignMessageLibContract {
  getAddress(): string
  signMessage(data: string, options?: TransactionOptions): Promise<TransactionResult>
  getMessageHash(message: string): Promise<string>
  encode(methodName: any, params: any): string
  estimateGas(methodName: string, params: any[], options: TransactionOptions): Promise<string>
}
