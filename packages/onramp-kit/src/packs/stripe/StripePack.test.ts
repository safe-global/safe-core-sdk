import EventEmitter from 'events'
import { StripePack } from './StripePack'
import * as stripeApi from './stripeApi'

import type { StripeOpenOptions, StripeSession } from './types'
import { OnRampKitBasePack } from '../..'

const openOptions: StripeOpenOptions = {
  element: '#root',
  defaultOptions: {
    transaction_details: {
      wallet_address: '0x',
      supported_destination_networks: ['ethereum']
    }
  }
}

const config = {
  stripePublicKey: 'pk_test_123',
  onRampBackendUrl: 'https://onramp-backend-url'
}

const session: StripeSession = {
  id: 'cos_1MhDe5KSn9ArdBimmQzf4vzc',
  object: 'crypto.onramp_session',
  client_secret: 'cos_1MhDe5KSn9ArdBimmQzf4vzc_secret_NaOoTfOKoDPCXfGVJz3KX15XO00H6ZNiTOm',
  livemode: false,
  status: 'initialized',
  transaction_details: {
    destination_currency: null,
    destination_network: null,
    lock_wallet_address: true,
    source_currency: null,
    source_exchange_amount: null,
    supported_destination_currencies: ['btc', 'eth', 'sol', 'usdc'],
    supported_destination_networks: ['ethereum', 'polygon'],
    transaction_id: null,
    wallet_address: '0xD725e11588f040d86c4C49d8236E32A5868549F0',
    wallet_addresses: null
  }
}

const eventEmitter = new EventEmitter()
const mockMount = jest.fn()
const mockAddEventListener = jest
  .fn()
  .mockImplementation((event, listener) => eventEmitter.on(event, listener))
const mockDispatch = jest.fn().mockImplementation((event, data) => eventEmitter.emit(event, data))

jest.mock('@stripe/crypto', () => {
  return {
    loadStripeOnramp: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        createSession: jest.fn().mockReturnValue({
          mount: mockMount,
          addEventListener: mockAddEventListener,
          dispatchEvent: mockDispatch
        })
      })
    })
  }
})

describe('StripePack', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a StripePack instance', () => {
    const stripePack = new StripePack(config)

    expect(stripePack).toBeInstanceOf(StripePack)
    expect(stripePack).toBeInstanceOf(OnRampKitBasePack)
  })

  it('should try to mount the node specified in the config when open() is called', async () => {
    const createSessionSpy = jest
      .spyOn(stripeApi, 'createSession')
      .mockImplementationOnce(() => Promise.resolve(session))

    const stripePack = new StripePack(config)

    await stripePack.init()

    const returnedSession = await stripePack.open(openOptions)

    expect(mockMount).toHaveBeenCalledWith(openOptions.element)
    expect(returnedSession).toEqual(session)
    expect(createSessionSpy).toHaveBeenCalledWith('https://onramp-backend-url', {
      transaction_details: {
        wallet_address: '0x',
        supported_destination_networks: ['ethereum']
      }
    })
  })

  it('should throw an exception if the createSession fail', async () => {
    const error = new Error('Error creating session')

    jest.spyOn(stripeApi, 'createSession').mockImplementationOnce(() => Promise.reject(error))

    const stripePack = new StripePack(config)

    await stripePack.init()

    await expect(stripePack.open(openOptions)).rejects.toThrowError(error)
  })

  it('should try to get the session if a sessionId is provided', async () => {
    const getSessionSpy = jest
      .spyOn(stripeApi, 'getSession')
      .mockImplementationOnce(() => Promise.resolve(session))

    const stripePack = new StripePack(config)

    await stripePack.init()

    const returnedSession = await stripePack.open({ ...openOptions, sessionId: 'session-id' })

    expect(mockMount).toHaveBeenCalledWith(openOptions.element)
    expect(returnedSession).toEqual(session)
    expect(getSessionSpy).toHaveBeenCalledWith('https://onramp-backend-url', 'session-id')
  })

  it('should respond to events', async () => {
    const mockOnLoaded = jest.fn()
    const mockOnSessionUpdated = jest.fn()

    jest.spyOn(stripeApi, 'createSession').mockImplementationOnce(() => Promise.resolve(session))

    const stripePack = new StripePack(config)

    await stripePack.init()

    await stripePack.open({
      ...openOptions
    })

    stripePack.subscribe('onramp_ui_loaded', mockOnLoaded)
    stripePack.subscribe('onramp_session_updated', mockOnSessionUpdated)

    expect(mockAddEventListener).toHaveBeenCalledTimes(2)
    mockDispatch('onramp_ui_loaded', 'sessionData')
    expect(mockOnLoaded).toHaveBeenCalled()

    mockDispatch('onramp_session_updated', {
      payload: {
        session: { status: 'fulfillment_complete', quote: { source_monetary_amount: '10' } }
      }
    })
    expect(mockOnSessionUpdated).toHaveBeenCalled()
  })
})
