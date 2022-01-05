import { TransactionOptions } from '../../utils/transactions/types'

export interface CreateProxyProps {
  safeMasterCopyAddress: string
  initializer: string
  saltNonce: number
  options?: TransactionOptions
}

interface GnosisSafeProxyFactory {
  getAddress(): string
  createProxy(options: CreateProxyProps): Promise<string>
  encode(methodName: string, params: any[]): string
}

export default GnosisSafeProxyFactory
