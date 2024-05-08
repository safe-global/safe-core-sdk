import { MetaTransactionData, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import { SafeTransactionOptionalProps } from '@safe-global/protocol-kit/utils/transactions'

import { SafeProviderConfig } from './safeProvider'
import { SafeContractImplementationType } from './contracts'
import { ContractNetworksConfig } from './contracts'
import { PredictedSafeProps } from './safeConfig'
import { passkeyArgType } from './passkeys'

export type CreateTransactionProps = {
  /** transactions - The transaction array to process */
  transactions: MetaTransactionData[]
  /** options - The transaction array optional properties */
  options?: SafeTransactionOptionalProps
  /** onlyCalls - Forces the execution of the transaction array with MultiSendCallOnly contract */
  onlyCalls?: boolean
}

type StandardizeSafeTxDataWithSafeContractProps = {
  /** safeContract - The Safe contract to use */
  safeContract: SafeContractImplementationType
  /** predictedSafe - The configuration of the Safe that is not yet deployed */
  predictedSafe?: never
}

type StandardizeSafeTxDataWithPredictedSafeProps = {
  /** safeContract - The Safe contract to use */
  safeContract?: never
  /** predictedSafe - The configuration of the Safe that is not yet deployed */
  predictedSafe: PredictedSafeProps
}

type StandardizeSafeTransactionData = {
  provider: SafeProviderConfig['provider']
  signer?: SafeProviderConfig['signer']
  /** tx - Safe transaction */
  tx: SafeTransactionDataPartial
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}

export type StandardizeSafeTxDataWithSafeContract = StandardizeSafeTransactionData &
  StandardizeSafeTxDataWithSafeContractProps
export type StandardizeSafeTxDataWithPredictedSafe = StandardizeSafeTransactionData &
  StandardizeSafeTxDataWithPredictedSafeProps
export type StandardizeSafeTransactionDataProps =
  | StandardizeSafeTxDataWithSafeContract
  | StandardizeSafeTxDataWithPredictedSafe

export type AddOwnerTxParams = {
  /** ownerAddress - The address of the new owner */
  ownerAddress: string
  /** threshold - The new threshold */
  threshold?: number
}

export type AddPasskeyOwnerTxParams = {
  /** passkey - The passkey of the new owner */
  passkey: passkeyArgType
  /** threshold - The new threshold */
  threshold?: number
}

export type RemoveOwnerTxParams = {
  /** ownerAddress - The address of the owner that will be removed */
  ownerAddress: string
  /** threshold - The new threshold */
  threshold?: number
}

export type SwapOwnerTxParams = {
  /** oldOwnerAddress - The old owner address */
  oldOwnerAddress: string
  /** newOwnerAddress - The new owner address */
  newOwnerAddress: string
}
