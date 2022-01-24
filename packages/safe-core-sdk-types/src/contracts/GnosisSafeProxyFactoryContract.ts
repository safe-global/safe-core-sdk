import { TransactionOptions } from '../types';

export interface CreateProxyProps {
  safeMasterCopyAddress: string
  initializer: string
  saltNonce: number
  options?: TransactionOptions
}

export interface GnosisSafeProxyFactoryContract {
  getAddress(): string
  createProxy(options: CreateProxyProps): Promise<string>
  encode(methodName: string, params: any[]): string
}
