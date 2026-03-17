import Safe from '@safe-global/protocol-kit'
import { MetaTransactionData, SafeTransaction } from '@safe-global/types-kit'

export type GelatoOptions = {
  apiKey: string
  protocolKit: Safe
}

export type GelatoCreateTransactionProps = {
  transactions: MetaTransactionData[]
  /** onlyCalls - Forces the execution of the transaction array with MultiSendCallOnly contract */
  onlyCalls?: boolean
}

export type GelatoExecuteTransactionProps = {
  executable: SafeTransaction
}

/** Status response from the Gelato Relay service. */
export type GelatoTaskStatus = {
  /** Status code: 100=Pending, 110=Submitted, 200=Success, 210=Finalized, 400=Rejected, 500=Reverted */
  status: number
  receipt?: {
    transactionHash: string
  }
}
