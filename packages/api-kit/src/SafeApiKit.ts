import { DecoderClient } from './clients/DecoderClient'
import { IndexerClient } from './clients/IndexerClient'
import { QueueClient } from './clients/QueueClient'
import {
  DEFAULT_DECODER_SERVICE_URL,
  DEFAULT_QUEUE_SERVICE_URL,
  getTransactionServiceUrl
} from './utils/config'

export interface SafeApiKitConfig {
  /** chainId - The chainId */
  chainId: bigint
  /**
   * txServiceUrl - Safe Transaction Service URL, used by `indexer`.
   * Defaults to the Safe hosted service of the chain.
   */
  txServiceUrl?: string
  /**
   * queueServiceUrl - Safe Queue Service URL, used by `queue`. The service is multi-chain, so the same
   * URL works for every chain. Defaults to the Safe hosted service.
   */
  queueServiceUrl?: string
  /**
   * decoderServiceUrl - Safe Decoder Service URL, used by `decoder`. The service is multi-chain.
   * Defaults to the Safe hosted service.
   */
  decoderServiceUrl?: string
  /**
   * apiKey - The API key to access the Safe services.
   * - Required if any of the service URLs is undefined
   * - Required if any of the service URLs contains "safe.global" or "5afe.dev"
   * - Optional otherwise
   */
  apiKey?: string
}

const API_KEY_HELP = 'Please obtain your API key at https://developer.safe.global.'

const isSafeHostedUrl = (url: string) =>
  url.includes('api.safe.global') || url.includes('api.5afe.dev')

const trimTrailingSlashes = (url: string): string => {
  let end = url.length
  while (end > 0 && url[end - 1] === '/') {
    end--
  }
  return url.slice(0, end)
}

/**
 * Resolves the base URL of a service and checks the API key requirements.
 */
function resolveServiceUrl(
  name: keyof SafeApiKitConfig,
  url: string | undefined,
  defaultUrl: string,
  apiKey?: string
): string {
  if (url) {
    if (isSafeHostedUrl(url) && !apiKey) {
      throw new Error(
        `apiKey is mandatory when using api.safe.global or api.5afe.dev domains. ${API_KEY_HELP}`
      )
    }
    return trimTrailingSlashes(url)
  }
  if (!apiKey) {
    throw new Error(`apiKey is mandatory when ${name} is not defined. ${API_KEY_HELP}`)
  }
  return defaultUrl
}

/**
 * Entry point to the Safe services. Each service is exposed as a client with one method per endpoint:
 * - `queue`: Safe Queue Service, the off-chain queue of multisig transactions, messages and delegates
 * - `indexer`: Safe Transaction Service, the data indexed from the chain and the ERC-4337 SafeOperations
 * - `decoder`: Safe Decoder Service, transaction data decoding
 */
class SafeApiKit {
  readonly queue: QueueClient
  readonly indexer: IndexerClient
  readonly decoder: DecoderClient

  constructor({
    chainId,
    txServiceUrl,
    queueServiceUrl,
    decoderServiceUrl,
    apiKey
  }: SafeApiKitConfig) {
    let txServiceBaseUrl: string
    if (txServiceUrl) {
      txServiceBaseUrl = resolveServiceUrl('txServiceUrl', txServiceUrl, '', apiKey)
    } else {
      if (!apiKey) {
        throw new Error(`apiKey is mandatory when txServiceUrl is not defined. ${API_KEY_HELP}`)
      }
      const url = getTransactionServiceUrl(chainId)
      if (!url) {
        throw new TypeError(
          `There is no transaction service available for chainId ${chainId}. Please set the txServiceUrl property to use a custom transaction service.`
        )
      }
      txServiceBaseUrl = url
    }

    const queueBaseUrl = resolveServiceUrl(
      'queueServiceUrl',
      queueServiceUrl,
      DEFAULT_QUEUE_SERVICE_URL,
      apiKey
    )
    const decoderBaseUrl = resolveServiceUrl(
      'decoderServiceUrl',
      decoderServiceUrl,
      DEFAULT_DECODER_SERVICE_URL,
      apiKey
    )

    this.indexer = new IndexerClient({ baseUrl: txServiceBaseUrl, chainId, apiKey })
    this.queue = new QueueClient({ baseUrl: `${queueBaseUrl}/api/v1`, chainId, apiKey })
    this.decoder = new DecoderClient({ baseUrl: `${decoderBaseUrl}/api/v1`, chainId, apiKey })
  }
}

export default SafeApiKit
