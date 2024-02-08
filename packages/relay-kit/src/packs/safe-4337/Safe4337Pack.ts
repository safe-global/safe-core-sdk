import { RelayKitBasePack } from '@safe-global/relay-kit/RelayKitBasePack'
import { Safe4337Options } from './types'
import { SafeTransaction } from 'packages/safe-core-sdk-types/dist/src'

export class Safe4337Pack extends RelayKitBasePack {
  constructor({ protocolKit }: Safe4337Options) {
    super(protocolKit)
  }

  async getEstimateFee(): Promise<string> {
    throw new Error('Method not implemented.')
  }

  async createRelayedTransaction(): Promise<SafeTransaction> {
    throw new Error('Method not implemented')
  }

  async executeRelayTransaction(): Promise<unknown> {
    throw new Error('Method not implemented')
  }
}
