import { Currency } from '@monerium/sdk'
import Safe from '@safe-global/protocol-kit'
import { getErrorMessage } from '@safe-global/onramp-kit/lib/errors'
import { SafeOnRampAdapter } from '@safe-global/onramp-kit/types'

import { SafeMoneriumClient } from './SafeMoneriumClient'
import {
  MoneriumEvent,
  MoneriumEventListener,
  MoneriumOpenOptions,
  MoneriumProviderConfig
} from './types'
import { connectToOrderNotifications } from './sockets'

const MONERIUM_CODE_VERIFIER = 'OnRampKit__monerium_code_verifier'
const SIGNATURE_MESSAGE = 'I hereby declare that I am the address owner.'

/**
 * This class implements the SafeOnRampClient interface for the Monerium provider
 * @class MoneriumPack
 */
export class MoneriumPack implements SafeOnRampAdapter<MoneriumPack> {
  #client?: SafeMoneriumClient
  #config: MoneriumProviderConfig
  #socket?: WebSocket
  #subscriptions: Map<MoneriumEvent, MoneriumEventListener> = new Map()

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
      const safeAddress = await this.#client.getSafeAddress()

      if (options.authCode) {
        await this.#startAuthCodeFlow(options.authCode, safeAddress, options.redirect_uri)
      } else {
        if (options.refreshToken) {
          await this.#startRefreshTokenFlow(safeAddress, options.refreshToken)
        } else {
          await this.#startAuthFlow(safeAddress, options.redirect_uri)
        }
      }

      if (this.#client.bearerProfile?.access_token && this.#subscriptions.size > 0) {
        this.#socket = connectToOrderNotifications({
          profile: this.#client.bearerProfile?.profile,
          env: this.#config.environment,
          accessToken: this.#client.bearerProfile?.access_token,
          subscriptions: this.#subscriptions
        })
      }

      return this.#client
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  async #startAuthCodeFlow(codeParam: string, safeAddress: string, redirectUrl: string) {
    if (!this.#client) return

    const codeVerifier = sessionStorage.getItem(MONERIUM_CODE_VERIFIER) || ''

    await this.#client.auth({
      client_id: this.#config.clientId,
      code: codeParam,
      code_verifier: codeVerifier,
      redirect_uri: redirectUrl
    })

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

    this.#addAccountIfNotLinked(safeAddress)
  }

  async #startAuthFlow(safeAddress: string, redirectUrl: string) {
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

    sessionStorage.setItem(MONERIUM_CODE_VERIFIER, this.#client.codeVerifier || '')

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

      if (!isSafeAddressLinked) {
        await this.#client.linkAddress(authContext.defaultProfile, {
          address: safeAddress,
          message: SIGNATURE_MESSAGE,
          signature: '0x',
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
  }

  subscribe(event: MoneriumEvent, handler: MoneriumEventListener): void {
    this.#subscriptions.set(event, handler)
  }

  unsubscribe(event: MoneriumEvent): void {
    this.#subscriptions.delete(event)

    if (this.#subscriptions.size === 0) {
      this.#socket?.close()
      this.#socket = undefined
    }
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
