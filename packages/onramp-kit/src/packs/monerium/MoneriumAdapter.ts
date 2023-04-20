import { Currency } from '@monerium/sdk'

import Safe from '@safe-global/protocol-kit'
import { getErrorMessage } from '@safe-global/onramp-kit/lib/errors'
import { SafeOnRampAdapter } from '@safe-global/onramp-kit/types'

import { SafeMoneriumClient } from './SafeMoneriumClient'
import { MoneriumOpenOptions, MoneriumProviderConfig } from './types'

const MONERIUM_CODE_VERIFIER = 'monerium_code_verifier'
const MONERIUM_REFRESH_TOKEN = 'monerium_refresh_token'
const SIGNATURE_MESSAGE = 'I hereby declare that I am the address owner.'

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
    if (!safeSdk) {
      throw new Error('You need to provide an instance of the protocol kit')
    }

    try {
      this.#client = new SafeMoneriumClient(this.#config.environment, safeSdk)
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  async open(options: MoneriumOpenOptions): Promise<SafeMoneriumClient> {
    if (!this.#client) {
      throw new Error('Monerium client not initialized')
    }

    try {
      const codeParam = new URLSearchParams(window.location.search).get('code')
      const safeAddress = await this.#client.getSafeAddress()

      if (codeParam) {
        await this.#startCodeParamFlow(codeParam, safeAddress, options.redirect_uri)
      } else {
        const refreshToken = localStorage.getItem(MONERIUM_REFRESH_TOKEN)
        if (refreshToken) {
          await this.#startRefreshTokenFlow(safeAddress, refreshToken)
        } else {
          await this.#startAuthCodeFlow(safeAddress, options.redirect_uri)
        }
      }

      return this.#client
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  async #startCodeParamFlow(codeParam: string, safeAddress: string, redirectUrl: string) {
    if (!this.#client) return

    const codeVerifier = localStorage.getItem(MONERIUM_CODE_VERIFIER) || ''

    await this.#client.auth({
      client_id: this.#config.clientId,
      code: codeParam,
      code_verifier: codeVerifier,
      redirect_uri: redirectUrl
    })

    localStorage.setItem(MONERIUM_REFRESH_TOKEN, this.#client?.bearerProfile?.refresh_token || '')

    await this.#addAccountIfNotLinked(safeAddress)

    this.#cleanQueryString()

    localStorage.removeItem(MONERIUM_CODE_VERIFIER)
  }

  async #startRefreshTokenFlow(safeAddress: string, refreshToken: string) {
    if (!this.#client) return

    await this.#client.auth({
      client_id: this.#config.clientId,
      refresh_token: refreshToken
    })

    const newRefreshToken = this.#client?.bearerProfile?.refresh_token || ''

    localStorage.setItem(MONERIUM_REFRESH_TOKEN, newRefreshToken)

    this.#addAccountIfNotLinked(safeAddress)
  }

  async #startAuthCodeFlow(safeAddress: string, redirectUrl: string) {
    if (!this.#client) return

    if (safeAddress) {
      const isSigned = await this.#client.isMessageSigned(safeAddress, SIGNATURE_MESSAGE)

      if (!isSigned) {
        const isPending = await this.#client.isSignMessagePending(safeAddress, SIGNATURE_MESSAGE)

        if (!isPending) {
          await this.#client.signMessage(safeAddress, SIGNATURE_MESSAGE)
        }
      }
    }

    const authFlowUrl = this.#client.getAuthFlowURI({
      client_id: this.#config.clientId,
      redirect_uri: redirectUrl,
      address: safeAddress,
      signature: '0x',
      chain: await this.#client.getChain(),
      network: await this.#client.getNetwork()
    })

    localStorage.setItem(MONERIUM_CODE_VERIFIER, this.#client.codeVerifier || '')

    window.location.replace(authFlowUrl)
  }

  async #addAccountIfNotLinked(safeAddress: string) {
    if (!this.#client) return

    const authContext = await this.#client.getAuthContext()

    if (!authContext) return

    const profile = await this.#client.getProfile(authContext.defaultProfile)

    if (profile) {
      const isSafeAddressLinked = profile.accounts.some(
        (account) => account.address === safeAddress
      )

      if (!isSafeAddressLinked && safeAddress) {
        await this.#client.linkAddress(authContext.defaultProfile, {
          address: safeAddress,
          message: SIGNATURE_MESSAGE,
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
