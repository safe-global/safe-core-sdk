import { DeploymentType } from '@safe-global/protocol-kit'

export const DEFAULT_DEPLOYMENT_TYPE: DeploymentType = 'canonical'

export enum SafeClientTxStatus {
  DEPLOYED_AND_EXECUTED = 'DEPLOYED_AND_EXECUTED',
  DEPLOYED_AND_PENDING_SIGNATURES = 'DEPLOYED_AND_PENDING_SIGNATURES',
  EXECUTED = 'EXECUTED',
  PENDING_SIGNATURES = 'PENDING_SIGNATURES',
  MESSAGE_PENDING_SIGNATURES = 'MESSAGE_PENDING_SIGNATURES',
  MESSAGE_CONFIRMED = 'MESSAGE_CONFIRMED',
  DEPLOYED_AND_MESSAGE_PENDING_SIGNATURES = 'DEPLOYED_AND_MESSAGE_PENDING_SIGNATURES',
  DEPLOYED_AND_MESSAGE_CONFIRMED = 'DEPLOYED_AND_MESSAGE_CONFIRMED',
  SAFE_OPERATION_EXECUTED = 'SAFE_OPERATION_EXECUTED',
  SAFE_OPERATION_PENDING_SIGNATURES = 'SAFE_OPERATION_PENDING_SIGNATURES'
}

const TRANSACTION_EXECUTED =
  'The transaction has been executed, check the ethereumTxHash in the transactions property to view it on the corresponding blockchain explorer'
const TRANSACTION_SAVED =
  'The transaction was not executed on-chain yet. There are pending signatures and you need to confirm it with other Safe owners first. Use the confirm(safeTxHash) method with other signer connected to the client'
const OFFCHAIN_MESSAGE_SAVED =
  'The message was stored using the Safe Transaction Service, you need to confirm it with other Safe owners in order to make it valid. Use the confirmMessage(messageHash) method with other signer connected to the client'
const OFFCHAIN_MESSAGE_CONFIRMED =
  'The message was stored using Safe services and now is confirmed and valid'
const SAFE_OPERATION_SAVED =
  'The UserOperation was stored using the Safe Transaction Service as an SafeOperation, you need to confirm it with other Safe owners in order to make it valid. Use the confirmSafeOperation(safeOperationHash) method with other signer connected to the client'
const SAFE_OPERATION_SENT_TO_BUNDLER =
  'The SafeOperation was sent to the bundler for being processed. Check the userOperationHash in the safeOperations property to see the SafeOperation in the corresponding explorer'
const SAFE_DEPLOYED =
  'A new Safe account was deployed, check the ethereumTxHash in the safeAccountDeployment property to view it on the corresponding blockchain explorer'

export const MESSAGES = {
  [SafeClientTxStatus.DEPLOYED_AND_EXECUTED]: `${SAFE_DEPLOYED}. ${TRANSACTION_EXECUTED}`,
  [SafeClientTxStatus.DEPLOYED_AND_PENDING_SIGNATURES]: `${SAFE_DEPLOYED}. ${TRANSACTION_SAVED}`,
  [SafeClientTxStatus.EXECUTED]: TRANSACTION_EXECUTED,
  [SafeClientTxStatus.PENDING_SIGNATURES]: TRANSACTION_SAVED,
  [SafeClientTxStatus.MESSAGE_PENDING_SIGNATURES]: OFFCHAIN_MESSAGE_SAVED,
  [SafeClientTxStatus.MESSAGE_CONFIRMED]: OFFCHAIN_MESSAGE_CONFIRMED,
  [SafeClientTxStatus.DEPLOYED_AND_MESSAGE_PENDING_SIGNATURES]: `${SAFE_DEPLOYED}. ${OFFCHAIN_MESSAGE_SAVED}`,
  [SafeClientTxStatus.DEPLOYED_AND_MESSAGE_CONFIRMED]: `${SAFE_DEPLOYED}. ${OFFCHAIN_MESSAGE_CONFIRMED}`,
  [SafeClientTxStatus.SAFE_OPERATION_EXECUTED]: SAFE_OPERATION_SENT_TO_BUNDLER,
  [SafeClientTxStatus.SAFE_OPERATION_PENDING_SIGNATURES]: SAFE_OPERATION_SAVED
}
