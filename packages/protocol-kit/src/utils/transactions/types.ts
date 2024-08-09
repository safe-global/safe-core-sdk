import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import { Chain, Address, Account } from 'viem'

export type SafeTransactionOptionalProps = Pick<
  SafeTransactionDataPartial,
  'safeTxGas' | 'baseGas' | 'gasPrice' | 'gasToken' | 'refundReceiver' | 'nonce'
>

export type WalletTransactionOptions = {
  chain: Chain
  account: Address | Account
  gas?: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  nonce?: number
}

export type WalletLegacyTransactionOptions = {
  chain: Chain
  account: Address | Account
  gas?: bigint
  gasPrice?: bigint
  nonce?: number
}
