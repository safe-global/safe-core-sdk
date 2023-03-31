import { MoneriumClient } from '@monerium/sdk'
import { getErrorMessage } from '@safe-global/onramp-kit/lib/errors'
import { SafeOnRampAdapter } from '@safe-global/onramp-kit/types'

import { MoneriumOpenOptions, MoneriumProviderConfig } from './types'

const MONERIUM_CODE_VERIFIER = 'monerium_code_verifier'

/**
 * This class implements the SafeOnRampClient interface for the Monerium provider
 * @class MoneriumAdapter
 */
export class MoneriumAdapter implements SafeOnRampAdapter<MoneriumAdapter> {
  #client?: MoneriumClient
  #config: MoneriumProviderConfig

  constructor(config: MoneriumProviderConfig) {
    this.#config = config
  }

  async init() {
    try {
      this.#client = new MoneriumClient(this.#config.environment)
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  async open(options: MoneriumOpenOptions): Promise<MoneriumClient> {
    const codeParam = new URLSearchParams(window.location.search).get('code')

    if (!this.#client) {
      throw new Error('Monerium client not initialized')
    }

    if (codeParam) {
      const codeVerifier = localStorage.getItem(MONERIUM_CODE_VERIFIER) || ''

      await this.#client.auth({
        client_id: this.#config.clientId,
        code: codeParam,
        code_verifier: codeVerifier,
        redirect_uri: options.redirect_uri
      })

      localStorage.removeItem(MONERIUM_CODE_VERIFIER)
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

    return this.#client
  }

  async close() {
    throw new Error('Method not implemented.')
  }

  subscribe(): void {
    throw new Error('Method not implemented.')
  }

  unsubscribe(): void {
    throw new Error('Method not implemented.')
  }
}
