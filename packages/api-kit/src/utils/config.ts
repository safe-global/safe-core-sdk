// TODO: Update to the production URL when available
const TRANSACTION_SERVICE_URL = 'https://api.5afe.dev/tx-service'

export const getTransactionServiceUrl = (chainId: bigint) => {
  return `${TRANSACTION_SERVICE_URL}/${chainId.toString()}/api`
}
