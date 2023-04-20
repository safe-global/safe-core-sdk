import Safe from '@safe-global/protocol-kit'
import { getErrorMessage } from '@safe-global/onramp-kit/lib/errors'
import { SafeOnRampAdapter } from '@safe-global/onramp-kit/types'
import { SafeMoneriumClient } from './SafeMoneriumClient'
import { MoneriumOpenOptions, MoneriumProviderConfig } from './types'
import { Currency } from '@monerium/sdk'

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

  async init(safeSdk: Safe) {
    try {
      this.#client = new SafeMoneriumClient(this.#config.environment, safeSdk)
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

        const authContext = await this.#client.getAuthContext()
        const profile = await this.#client.getProfile(authContext.defaultProfile)
        if (profile) {
          const isSafeAddressLinked = profile.accounts.some(
            (account) => account.address === options.address
          )

          if (!isSafeAddressLinked && options.address) {
            await this.#client.linkAddress(authContext.defaultProfile, {
              address: options.address,
              message: 'I hereby declare that I am the address owner.',
              signature: '0x',
              // @ts-expect-error - network and chain are not defined in the type and mandatory for multisig (signature 0x)
              network: await this.#client.getNetwork(),
              chain: await this.#client.getChain(),
              accounts: [
                {
                  network: await this.#client.getNetwork(),
                  chain: await this.#client.getChain(),
                  currency: Currency.eur
                }
              ]
            })
          }
        }

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
        if (options?.address) {
          try {
            const message = 'I hereby declare that I am the address owner.'
            const isSigned = await this.#client.isMessageSigned(options?.address, message)

            if (!isSigned) {
              const isPending = await this.#client.isSignMessagePending(options?.address, message)

              if (!isPending) {
                await this.#client.signMessage(options?.address, message)
              }
            }
          } catch (error) {
            throw new Error(getErrorMessage(error))
          }
        }

        const authFlowUrl = this.#client.getAuthFlowURI({
          client_id: this.#config.clientId,
          redirect_uri: options.redirect_uri,
          address: options?.address,
          signature: options?.address ? options?.signature || '0x' : undefined,
          chain: await this.#client.getChain(),
          network: await this.#client.getNetwork()
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
    // TODO: Check websocket connection through Monerium API
    throw new Error('Method not implemented.')
  }

  unsubscribe(): void {
    // TODO: Check websocket connection through Monerium API
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
