import { getErrorMessage } from '@safe-global/onramp-kit/lib/errors'
import { SafeOnRampAdapter } from '@safe-global/onramp-kit/types'
import { SafeMoneriumClient } from './SafeMoneriumClient'

import { MoneriumOpenOptions, MoneriumProviderConfig } from './types'

const MONERIUM_CODE_VERIFIER = 'monerium_code_verifier'
const MONERIUM_REFRESH_TOKEN = 'monerium_refresh_token'

/**
 * This class implements the SafeOnRampClient interface for the Monerium provider
 * @class MoneriumAdapter
 */
export class MoneriumAdapter implements SafeOnRampAdapter<MoneriumAdapter> {
  #client?: SafeMoneriumClient
  #config: MoneriumProviderConfig

  constructor(config: MoneriumProviderConfig) {
    this.#config = config
  }

  async init() {
    try {
      this.#client = new SafeMoneriumClient(this.#config.environment)
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  async open(options: MoneriumOpenOptions): Promise<SafeMoneriumClient> {
    if (!this.#client) {
      throw new Error('Monerium client not initialized')
    }

    const codeParam = new URLSearchParams(window.location.search).get('code')

    if (codeParam) {
      const codeVerifier = localStorage.getItem(MONERIUM_CODE_VERIFIER) || ''

      try {
        await this.#client.auth({
          client_id: this.#config.clientId,
          code: codeParam,
          code_verifier: codeVerifier,
          redirect_uri: options.redirect_uri
        })

        localStorage.setItem(
          MONERIUM_REFRESH_TOKEN,
          this.#client?.bearerProfile?.refresh_token || ''
        )

        this.#cleanQueryString()
      } catch (e) {
        throw new Error(getErrorMessage(e))
      } finally {
        localStorage.removeItem(MONERIUM_CODE_VERIFIER)
      }
    } else {
      const refreshToken = localStorage.getItem(MONERIUM_REFRESH_TOKEN)
      if (refreshToken) {
        try {
          await this.#client.auth({
            client_id: this.#config.clientId,
            refresh_token: refreshToken
          })
          localStorage.setItem(
            MONERIUM_REFRESH_TOKEN,
            this.#client?.bearerProfile?.refresh_token || ''
          )
        } catch (e) {
          throw new Error(getErrorMessage(e))
        }
      } else {
        const authFlowUrl = this.#client.getAuthFlowURI({
          client_id: this.#config.clientId,
          redirect_uri: options.redirect_uri,
          address: options?.address,
          signature: options?.signature,
          chain: options?.chain,
          network: options?.network
        })

        localStorage.setItem(MONERIUM_CODE_VERIFIER, this.#client.codeVerifier || '')

        window.location.replace(authFlowUrl)
      }
    }

    return this.#client
  }

  async close() {
    localStorage.removeItem(MONERIUM_CODE_VERIFIER)
    localStorage.removeItem(MONERIUM_REFRESH_TOKEN)
  }

  subscribe(): void {
    throw new Error('Method not implemented.')
  }

  unsubscribe(): void {
    throw new Error('Method not implemented.')
  }

  #cleanQueryString() {
    const url = window.location.href
    const [baseUrl, queryString] = url.split('?')

    // Check if there is a query string
    if (queryString) {
      window.history.replaceState(null, '', baseUrl)
    }
  }
}
