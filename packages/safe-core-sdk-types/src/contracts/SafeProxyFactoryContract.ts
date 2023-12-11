import { TransactionOptions } from '@safe-global/safe-core-sdk-types/types'

export interface CreateProxyProps {
  safeSingletonAddress: string
  initializer: string
  saltNonce: string
  options?: TransactionOptions
  callback?: (txHash: string) => void
}

export interface SafeProxyFactoryContract {
  getAddress(): Promise<string>
  proxyCreationCode(): Promise<string>
  createProxy(options: CreateProxyProps): Promise<string>
  encode(methodName: string, params: any[]): string
  estimateGas(methodName: string, params: any[], options: TransactionOptions): Promise<string>
}
