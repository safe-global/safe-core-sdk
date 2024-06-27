export enum SafeClientTxStatus {
  DEPLOYED_AND_EXECUTED = 'DEPLOYED_AND_EXECUTED',
  DEPLOYED_AND_PENDING_SIGNATURES = 'DEPLOYED_AND_PENDING_SIGNATURES',
  EXECUTED = 'EXECUTED',
  FAILED = 'FAILED',
  PENDING_SIGNATURES = 'PENDING_SIGNATURES'
}

export const MESSAGES = {
  [SafeClientTxStatus.DEPLOYED_AND_EXECUTED]:
    'The transaction has been executed. A new Safe account was deployed, check the deployment property to see the Safe account information and deployment hash.',
  [SafeClientTxStatus.DEPLOYED_AND_PENDING_SIGNATURES]:
    'A new Safe account was deployed, check the deployment property to see the Safe account information and deployment hash. The transaction was not executed on-chain yet. It was stored in the Safe services and you need to confirm it with other Safe owners first. Use the confirm(safeTxHash) method with other signer connected to the client.',
  [SafeClientTxStatus.EXECUTED]: 'The transaction has been executed on-chain.',
  [SafeClientTxStatus.FAILED]: 'The transaction has failed.',
  [SafeClientTxStatus.PENDING_SIGNATURES]:
    'The transaction was not executed on-chain yet. It was stored in the Safe services and you need to confirm it with other Safe owners first. Use the confirm(safeTxHash) method with other signer connected to the client.'
}
