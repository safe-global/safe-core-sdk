import { JsonFragment } from 'ethers'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

export type RequestArguments = {
  readonly method: string
  readonly params?: readonly unknown[] | object
}

export interface Eip1193Provider {
  request: (args: RequestArguments) => Promise<unknown>
}

export interface SafeProviderTransaction {
  to: string
  from: string
  data: string
  value?: string
  gasPrice?: number | string
  gasLimit?: number | string
  maxFeePerGas?: number | string
  maxPriorityFeePerGas?: number | string
}

export interface GetContractProps {
  safeVersion: SafeVersion
  customContractAddress?: string
  customContractAbi?: JsonFragment | JsonFragment[]
  isL1SafeSingleton?: boolean
}
