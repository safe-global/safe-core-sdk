import { DecoderClient } from './clients/DecoderClient'
import { IndexerClient, IndexerUrl } from './clients/IndexerClient'
import { QueueClient } from './clients/QueueClient'
import {
  DEFAULT_DECODER_SERVICE_URL,
  DEFAULT_QUEUE_SERVICE_URL,
  getTransactionServiceUrl,
  isSafeHostedUrl,
  networks
} from './utils/config'

export interface SafeApiKitConfig {
  /**
   * indexerUrls - Safe Transaction Service URL of some chains, used by `indexer`, including the `/api` path
   * (e.g. `[{ chainId: 11155111n, url: 'https://my-indexer.example.com/api' }]`).
   * The chains without one use the Safe hosted service.
   */
  indexerUrls?: IndexerUrl[]
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
   * apiKey - The API key of the Safe hosted services. Required by every service without a custom URL
   * (for `indexer`, every chain without an `indexerUrls` entry) and by the URLs of the "safe.global"
   * and "5afe.dev" domains. Optional otherwise. It is only sent to the Safe hosted services, never to a custom URL.
   */
  apiKey?: string
}

type ServiceUrlOption = 'queueServiceUrl' | 'decoderServiceUrl'

const API_KEY_HELP = 'Please obtain your API key at https://developer.safe.global.'

const checkHostedApiKey = (url: string, apiKey?: string): void => {
  if (isSafeHostedUrl(url) && !apiKey) {
    throw new Error(
      `apiKey is mandatory when using api.safe.global or api.5afe.dev domains. ${API_KEY_HELP}`
    )
  }
}

const trimTrailingSlashes = (url: string): string => {
  let end = url.length
  while (end > 0 && url[end - 1] === '/') {
    end--
  }
  return url.slice(0, end)
}

/** Returns the custom URL of a service, or `undefined` to use the Safe hosted one. Throws if the apiKey is missing */
function resolveServiceUrl(
  name: ServiceUrlOption,
  url: string | undefined,
  apiKey?: string
): string | undefined {
  if (url) {
    checkHostedApiKey(url, apiKey)
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
 * Each client is created the first time it is used and only checks its own configuration,
 * so a service that is not configured does not prevent using the others.
 */
class SafeApiKit {
  readonly #config: SafeApiKitConfig
  #queue?: QueueClient
  #indexer?: IndexerClient
  #indexerUrls?: IndexerUrl[]
  #decoder?: DecoderClient

  constructor(config: SafeApiKitConfig = {}) {
    this.#config = config
  }

  /** Safe Queue Service client */
  get queue(): QueueClient {
    if (!this.#queue) {
      const { queueServiceUrl, apiKey } = this.#config
      const baseUrl =
        resolveServiceUrl('queueServiceUrl', queueServiceUrl, apiKey) ?? DEFAULT_QUEUE_SERVICE_URL
      this.#queue = new QueueClient({ baseUrl, apiKey })
    }
    return this.#queue
  }

  /** Safe Transaction Service client */
  get indexer(): IndexerClient {
    if (!this.#indexer) {
      this.#indexer = new IndexerClient({
        urls: this.#getCustomIndexerUrls(),
        apiKey: this.#config.apiKey
      })
    }
    return this.#indexer
  }

  /**
   * Returns the Transaction Service URL of every chain the indexer can be used with: the `indexerUrls`
   * entries and, with an `apiKey`, the Safe hosted service of the other chains.
   */
  getIndexerUrls(): IndexerUrl[] {
    const customUrls = this.#getCustomIndexerUrls()
    if (!this.#config.apiKey) {
      return customUrls
    }
    const customChainIds = new Set(customUrls.map(({ chainId }) => chainId))
    const hostedUrls = networks
      .filter(({ chainId }) => !customChainIds.has(chainId))
      .map(({ chainId }) => ({ chainId, url: getTransactionServiceUrl(chainId) }))
    return [...customUrls, ...hostedUrls]
  }

  #getCustomIndexerUrls(): IndexerUrl[] {
    if (!this.#indexerUrls) {
      const { indexerUrls = [], apiKey } = this.#config
      const chainIds = new Set<bigint>()
      this.#indexerUrls = indexerUrls.map(({ chainId: rawChainId, url }) => {
        // Accept a number or a string chainId from JavaScript or a JSON config
        const chainId = BigInt(rawChainId)
        if (chainIds.has(chainId)) {
          throw new Error(`indexerUrls has more than one URL for chainId ${chainId}`)
        }
        chainIds.add(chainId)
        checkHostedApiKey(url, apiKey)
        return { chainId, url: trimTrailingSlashes(url) }
      })
    }
    return this.#indexerUrls.map((indexerUrl) => ({ ...indexerUrl }))
  }

  /** Safe Decoder Service client */
  get decoder(): DecoderClient {
    if (!this.#decoder) {
      const { decoderServiceUrl, apiKey } = this.#config
      const baseUrl =
        resolveServiceUrl('decoderServiceUrl', decoderServiceUrl, apiKey) ??
        DEFAULT_DECODER_SERVICE_URL
      this.#decoder = new DecoderClient({ baseUrl, apiKey })
    }
    return this.#decoder
  }
}

export default SafeApiKit
