import { DecoderClient } from './clients/DecoderClient'
import { IndexerClient } from './clients/IndexerClient'
import { QueueClient } from './clients/QueueClient'
import { DEFAULT_DECODER_SERVICE_URL, DEFAULT_QUEUE_SERVICE_URL } from './utils/config'

export interface SafeApiKitConfig {
  /** chainId - Default chain of the requests. Each method can set its own `chainId` */
  chainId?: bigint
  /**
   * indexerServiceUrl - Safe Transaction Service URL, used by `indexer`, including the `/api` path
   * (e.g. `https://api.safe.global/tx-service/eth/api`). It only serves the `chainId` of the kit.
   * Defaults to the Safe hosted service of the chain of each request.
   */
  indexerServiceUrl?: string
  /**
   * txServiceUrl - Former name of `indexerServiceUrl`, still accepted. `indexerServiceUrl` takes precedence.
   * @deprecated Use `indexerServiceUrl` instead.
   */
  txServiceUrl?: string
  /**
   * queueServiceUrl - Safe Queue Service URL, used by `queue`, including the `/api` path
   * (e.g. `https://api.safe.global/queue/api`). The service is multi-chain, so the same URL works for every chain.
   * Defaults to the Safe hosted service.
   */
  queueServiceUrl?: string
  /**
   * decoderServiceUrl - Safe Decoder Service URL, used by `decoder`, including the `/api` path
   * (e.g. `https://api.safe.global/decoder/api`). The service is multi-chain. Defaults to the Safe hosted service.
   */
  decoderServiceUrl?: string
  /**
   * apiKey - The API key to access the Safe services.
   * - Required to use a service whose URL is undefined
   * - Required to use a service whose URL contains "safe.global" or "5afe.dev"
   * - Optional otherwise
   *
   * Each service is checked when its client is first used, so a missing configuration only affects that client.
   */
  apiKey?: string
}

type ServiceUrlOption = 'indexerServiceUrl' | 'queueServiceUrl' | 'decoderServiceUrl'

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
 * Checks the API key requirements and returns the custom URL, or `undefined` for the Safe hosted service.
 */
function resolveServiceUrl(
  name: ServiceUrlOption,
  url: string | undefined,
  apiKey?: string
): string | undefined {
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
  return undefined
}

/**
 * Entry point to the Safe services. Each service is exposed as a client with one method per endpoint:
 * - `queue`: Safe Queue Service, the off-chain queue of multisig transactions, messages and delegates
 * - `indexer`: Safe Transaction Service, the data indexed from the chain and the ERC-4337 SafeOperations
 * - `decoder`: Safe Decoder Service, transaction data decoding
 *
 * The clients are created independently the first time they are used, so a service that is not configured
 * (e.g. a self-hosted Transaction Service without an API key for the hosted Queue Service) does not prevent
 * using the others. A misconfigured service throws when its client is accessed.
 */
class SafeApiKit {
  readonly #config: SafeApiKitConfig
  #queue?: QueueClient
  #indexer?: IndexerClient
  #decoder?: DecoderClient

  constructor(config: SafeApiKitConfig = {}) {
    this.#config = config
  }

  /** Returns a kit with the same configuration and another default chain */
  forChain(chainId: bigint): SafeApiKit {
    return new SafeApiKit({ ...this.#config, chainId })
  }

  /** Safe Queue Service client */
  get queue(): QueueClient {
    if (!this.#queue) {
      const { chainId, queueServiceUrl, apiKey } = this.#config
      const baseUrl =
        resolveServiceUrl('queueServiceUrl', queueServiceUrl, apiKey) ?? DEFAULT_QUEUE_SERVICE_URL
      this.#queue = new QueueClient({ baseUrl, chainId, apiKey })
    }
    return this.#queue
  }

  /** Safe Transaction Service client */
  get indexer(): IndexerClient {
    if (!this.#indexer) {
      const { chainId, indexerServiceUrl, txServiceUrl, apiKey } = this.#config
      const baseUrl = resolveServiceUrl(
        'indexerServiceUrl',
        indexerServiceUrl || txServiceUrl,
        apiKey
      )
      this.#indexer = new IndexerClient({ baseUrl, chainId, apiKey })
    }
    return this.#indexer
  }

  /** Safe Decoder Service client */
  get decoder(): DecoderClient {
    if (!this.#decoder) {
      const { chainId, decoderServiceUrl, apiKey } = this.#config
      const baseUrl =
        resolveServiceUrl('decoderServiceUrl', decoderServiceUrl, apiKey) ??
        DEFAULT_DECODER_SERVICE_URL
      this.#decoder = new DecoderClient({ baseUrl, chainId, apiKey })
    }
    return this.#decoder
  }
}

export default SafeApiKit
