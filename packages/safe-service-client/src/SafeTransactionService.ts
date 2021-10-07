import { Signer } from '@ethersproject/abstract-signer'
import { SafeSignature, SafeTransactionData } from '@gnosis.pm/safe-core-sdk-types'
import {
  MasterCopyResponse,
  OwnerResponse,
  SafeBalanceResponse,
  SafeBalancesOptions,
  SafeBalancesUsdOptions,
  SafeBalanceUsdResponse,
  SafeCollectibleResponse,
  SafeCollectiblesOptions,
  SafeCreationInfoResponse,
  SafeDelegate,
  SafeDelegateConfig,
  SafeDelegateDeleteConfig,
  SafeDelegateListResponse,
  SafeInfoResponse,
  SafeModuleTransactionListResponse,
  SafeMultisigConfirmationListResponse,
  SafeMultisigTransactionEstimate,
  SafeMultisigTransactionEstimateResponse,
  SafeMultisigTransactionListResponse,
  SafeMultisigTransactionResponse,
  SafeServiceInfoResponse,
  SignatureResponse,
  TokenInfoListResponse,
  TokenInfoResponse,
  TransferListResponse
} from './types/safeTransactionServiceTypes'

interface SafeTransactionService {
  // About
  getServiceInfo(): Promise<SafeServiceInfoResponse>
  getServiceMasterCopiesInfo(): Promise<MasterCopyResponse[]>

  // Data decoder
  decodeData(data: string): Promise<any>

  // Owners
  getSafesByOwner(ownerAddress: string): Promise<OwnerResponse>

  // Multisig transactions
  getTransaction(safeTxHash: string): Promise<SafeMultisigTransactionResponse>
  getTransactionConfirmations(safeTxHash: string): Promise<SafeMultisigConfirmationListResponse>
  confirmTransaction(safeTxHash: string, signature: string): Promise<SignatureResponse>

  // Safes
  getSafeInfo(safeAddress: string): Promise<SafeInfoResponse>
  getSafeDelegates(safeAddress: string): Promise<SafeDelegateListResponse>
  addSafeDelegate(config: SafeDelegateConfig): Promise<SafeDelegate>
  removeSafeDelegate(config: SafeDelegateDeleteConfig): Promise<void>
  removeAllSafeDelegates(safeAddress: string, signer: Signer): Promise<void>

  // Transactions
  getSafeCreationInfo(safeAddress: string): Promise<SafeCreationInfoResponse>
  estimateSafeTransaction(
    safeAddress: string,
    safeTransaction: SafeMultisigTransactionEstimate
  ): Promise<SafeMultisigTransactionEstimateResponse>
  proposeTransaction(
    safeAddress: string,
    transaction: SafeTransactionData,
    safeTxHash: string,
    signature: SafeSignature
  ): Promise<void>
  getIncomingTransactions(safeAddress: string): Promise<TransferListResponse>
  getModuleTransactions(safeAddress: string): Promise<SafeModuleTransactionListResponse>
  getMultisigTransactions(safeAddress: string): Promise<SafeMultisigTransactionListResponse>
  getPendingTransactions(
    safeAddress: string,
    currentNonce?: number
  ): Promise<SafeMultisigTransactionListResponse>

  // Balances
  getBalances(safeAddress: string, options?: SafeBalancesOptions): Promise<SafeBalanceResponse[]>
  getUsdBalances(
    safeAddress: string,
    options?: SafeBalancesUsdOptions
  ): Promise<SafeBalanceUsdResponse[]>
  getCollectibles(
    safeAddress: string,
    options?: SafeCollectiblesOptions
  ): Promise<SafeCollectibleResponse[]>

  // Tokens
  getTokenList(): Promise<TokenInfoListResponse>
  getToken(tokenAddress: string): Promise<TokenInfoResponse>
}

export default SafeTransactionService
