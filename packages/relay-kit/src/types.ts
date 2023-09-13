import Safe from '@safe-global/protocol-kit'
import { MetaTransactionData, MetaTransactionOptions } from '@safe-global/safe-core-sdk-types'

export interface CreateTransactionProps {
  safe: Safe
  /** transactions - The transaction array to process */
  transactions: MetaTransactionData[]
  /** options - The transaction array optional properties */
  options?: MetaTransactionOptions
  /** onlyCalls - Forces the execution of the transaction array with MultiSendCallOnly contract */
  onlyCalls?: boolean
}
