import { OrderState } from '@monerium/sdk'
import Safe from '@safe-global/protocol-kit'
import { MoneriumPack } from './MoneriumPack'
import * as safeMoneriumClient from './SafeMoneriumClient'
import * as sockets from './sockets'
import { OnRampKitBasePack } from '../../OnRampKitBasePack'

Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    ...window.location,
    replace: jest.fn()
  }
})

Object.defineProperty(safeMoneriumClient.SafeMoneriumClient.prototype, 'bearerProfile', {
  get: jest.fn(() => ({
    access_token: 'access-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'refresh-token',
    profile: 'profile',
    userId: 'userId'
  }))
})

const config = {
  clientId: 'monerium-client-id',
  environment: 'sandbox' as const
}

const REDIRECT_URL = 'http://localhost:3000'

jest.mock('./sockets.ts')
jest.mock('@monerium/sdk')
jest.mock('@safe-global/protocol-kit')
jest.mock('./SafeMoneriumClient')

describe('MoneriumPack', () => {
  let moneriumPack: MoneriumPack

  beforeEach(() => {
    jest.clearAllMocks()
    moneriumPack = new MoneriumPack(config)
  })

  describe('init()', () => {
    it('should create a MoneriumPack instance', () => {
      expect(moneriumPack).toBeInstanceOf(MoneriumPack)
      expect(moneriumPack).toBeInstanceOf(OnRampKitBasePack)
    })

    it('should initialize the pack', async () => {
      const safeSdk = new Safe()

      await moneriumPack.init({ safeSdk })

      expect(safeMoneriumClient.SafeMoneriumClient).toHaveBeenCalledWith('sandbox', safeSdk)
    })

    it('should throw an exception if no instance of the protocol kit is passed as parameter', async () => {
      // @ts-expect-error - Throw and exception
      await expect(moneriumPack.init()).rejects.toThrowError(
        'You need to provide an instance of the protocol kit'
      )
    })
  })

  describe('open()', () => {
    beforeEach(async () => {
      const safeSdk = new Safe()

      await moneriumPack.init({ safeSdk })
    })

    it('should start the authorization code flow if the authCode is provided', async () => {
      const getAuthSpy = jest.spyOn(safeMoneriumClient.SafeMoneriumClient.prototype, 'auth')

      await moneriumPack.open({ redirectUrl: REDIRECT_URL, authCode: 'auth-code' })

      expect(getAuthSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: 'monerium-client-id',
          code: 'auth-code',
          code_verifier: '',
          redirect_uri: REDIRECT_URL
        })
      )
    })

    it('should start the refresh token flow if the refreshToken is provided', async () => {
      const getAuthSpy = jest.spyOn(safeMoneriumClient.SafeMoneriumClient.prototype, 'auth')

      await moneriumPack.open({
        redirectUrl: REDIRECT_URL,
        refreshToken: 'refresh-token'
      })

      expect(getAuthSpy).toHaveBeenCalledWith(
        expect.objectContaining({ client_id: 'monerium-client-id', refresh_token: 'refresh-token' })
      )
    })

    it('should start the Login with Monerium flow when no authCode or refreshToken are provided', async () => {
      const getAuthFlowSpy = jest.spyOn(
        safeMoneriumClient.SafeMoneriumClient.prototype,
        'getAuthFlowURI'
      )

      await moneriumPack.open({
        redirectUrl: REDIRECT_URL
      })

      expect(getAuthFlowSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: 'monerium-client-id',
          redirect_uri: REDIRECT_URL,
          signature: '0x'
        })
      )
    })

    it('should check if the message is in the pending safe transactions queue when not signed', async () => {
      jest
        .spyOn(safeMoneriumClient.SafeMoneriumClient.prototype, 'isMessageSigned')
        .mockResolvedValue(false)

      jest
        .spyOn(safeMoneriumClient.SafeMoneriumClient.prototype, 'getSafeAddress')
        .mockResolvedValue('0xSafeAddress')

      const isMessagePendingSpy = jest.spyOn(
        safeMoneriumClient.SafeMoneriumClient.prototype,
        'isSignMessagePending'
      )

      await moneriumPack.open({
        redirectUrl: REDIRECT_URL
      })

      expect(isMessagePendingSpy).toHaveBeenCalledWith(
        '0xSafeAddress',
        'I hereby declare that I am the address owner.'
      )
    })
  })

  describe('subscribe() / unsubscribe()', () => {
    it('should try to subscribe to order notifications after authentication finished and subscriptions placed', async () => {
      const safeSdk = new Safe()

      await moneriumPack.init({ safeSdk })

      const socket = { close: jest.fn() }

      // @ts-expect-error - Mocking the socket
      jest.spyOn(sockets, 'connectToOrderNotifications').mockReturnValue(socket)

      moneriumPack.subscribe(OrderState.placed, jest.fn())
      moneriumPack.subscribe(OrderState.processed, jest.fn())

      await moneriumPack.open({
        redirectUrl: REDIRECT_URL
      })

      expect(sockets.connectToOrderNotifications).toHaveBeenCalledWith({
        accessToken: 'access-token',
        profile: 'profile',
        env: 'sandbox',
        subscriptions: new Map([
          [OrderState.placed, expect.any(Function)],
          [OrderState.processed, expect.any(Function)]
        ])
      })

      moneriumPack.unsubscribe(OrderState.placed)
      moneriumPack.unsubscribe(OrderState.processed)

      expect(socket.close).toHaveBeenCalled()
    })
  })

  describe('close()', () => {
    it('should remove the codeVerifier from the storage', async () => {
      const localStorageSpy = jest.spyOn(window.localStorage.__proto__, 'removeItem')

      const safeSdk = new Safe()

      await moneriumPack.init({ safeSdk })

      await moneriumPack.close()

      expect(localStorageSpy).toHaveBeenCalledWith('OnRampKit__monerium_code_verifier')
    })
  })
})
