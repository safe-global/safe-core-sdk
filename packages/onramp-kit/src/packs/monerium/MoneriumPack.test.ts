import Safe from '@safe-global/protocol-kit'
import { MoneriumPack } from './MoneriumPack'
import * as safeMoneriumClient from './SafeMoneriumClient'
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

const REDIRECT_URL = 'http://localhost:3000'
const config = {
  clientId: 'monerium-client-id',
  redirectUrl: REDIRECT_URL,
  environment: 'sandbox' as const
}

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

      expect(safeMoneriumClient.SafeMoneriumClient).toHaveBeenCalledWith(
        {
          clientId: 'monerium-client-id',
          environment: 'sandbox',
          redirectUrl: 'http://localhost:3000'
        },
        safeSdk
      )
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

    it('should call order socket', async () => {
      const getConnectSocketSpy = jest.spyOn(
        safeMoneriumClient.SafeMoneriumClient.prototype,
        'connectOrderSocket'
      )

      await moneriumPack.open()

      expect(getConnectSocketSpy).toHaveBeenCalledWith()
    })

    it('should call getAccess', async () => {
      const getAuthFlowSpy = jest.spyOn(
        safeMoneriumClient.SafeMoneriumClient.prototype,
        'getAccess'
      )

      await moneriumPack.open()

      expect(getAuthFlowSpy).toHaveBeenCalledWith()
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

      await moneriumPack.open({ initiateAuthFlow: true })

      expect(isMessagePendingSpy).toHaveBeenCalledWith(
        '0xSafeAddress',
        'I hereby declare that I am the address owner.'
      )
    })
  })

  describe('close()', () => {
    it('should call disconnect', async () => {
      const disconnectSpy = jest.spyOn(
        safeMoneriumClient.SafeMoneriumClient.prototype,
        'revokeAccess'
      )
      const safeSdk = new Safe()

      await moneriumPack.init({ safeSdk })

      await moneriumPack.close()

      await moneriumPack.open()

      expect(disconnectSpy).toHaveBeenCalledWith()
    })
  })
})
