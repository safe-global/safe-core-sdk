import { MagicConnectPack } from './MagicConnectPack'
import { generateTestingUtils } from 'eth-testing'
import EventEmitter from 'events'
import { AuthKitBasePack } from '../../AuthKitBasePack'
import {
  MAGIC_EVENT_CONNECTED,
  MAGIC_EVENT_DISCONNECTED,
  MagicConfig,
  MagicInitOptions
} from './types'
import { Magic } from 'magic-sdk'

const eventEmitter = new EventEmitter()
const testingUtils = generateTestingUtils({ providerType: 'MetaMask' })
const mockProvider = testingUtils.getProvider()
const mockInitModal = jest.fn()
const mockUser = jest.fn().mockResolvedValue(false)
const mockConnect = jest.fn().mockImplementation(() => {
  eventEmitter.emit(MAGIC_EVENT_CONNECTED)
  return Promise.resolve()
})
const mockLogout = jest.fn().mockImplementation(() => eventEmitter.emit(MAGIC_EVENT_DISCONNECTED))

jest.mock('@safe-global/api-kit', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSafesByOwner: jest.fn().mockImplementation(() => {
        return Promise.resolve({ safes: ['0xSafe1', '0xSafe2'] })
      })
    }
  })
})

jest.mock('magic-sdk', () => {
  return {
    Magic: jest.fn().mockImplementation(() => {
      return {
        user: {
          isLoggedIn: mockUser
        },
        wallet: {
          getProvider: jest.fn().mockReturnValue(mockProvider),
          connectWithUI: mockConnect,
          disconnect: mockLogout,
          requestUserInfoWithUI: jest.fn().mockResolvedValue({
            email: 'mockMail@mail.com'
          })
        }
      }
    })
  }
})

const magicConfig: MagicConfig = {
  txServiceUrl: 'https://txservice-url.com'
}

const magicInitOptions: MagicInitOptions = {
  apiKey: 'api-key',
  options: {
    network: 'goerli'
  }
}

describe('MagicConnectPack', () => {
  let magicConnectPack: MagicConnectPack

  beforeAll(async () => {
    magicConnectPack = new MagicConnectPack(magicConfig)

    await magicConnectPack.init(magicInitOptions)
  })

  beforeEach(() => {
    jest.clearAllMocks()
    testingUtils.clearAllMocks()
    mockInitModal.mockClear()
    mockConnect.mockClear()
  })

  describe('init()', () => {
    it('should initialize Magic SDK', async () => {
      expect(magicConnectPack.getProvider()).not.toBeNull()
      expect(magicConnectPack).toBeInstanceOf(MagicConnectPack)
      expect(magicConnectPack).toBeInstanceOf(AuthKitBasePack)
    })

    it('should instantiate the Magic SDK', async () => {
      await magicConnectPack.init(magicInitOptions)

      expect(Magic).toHaveBeenCalledWith(magicInitOptions.apiKey, magicInitOptions.options)
    })

    it('should initialize the provider', async () => {
      await magicConnectPack.init(magicInitOptions)

      expect(magicConnectPack.getProvider()).toBe(mockProvider)
    })
  })

  describe('signIn()', () => {
    it('should call the connectWithUI() method', async () => {
      testingUtils.mockAccounts(['0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf'])

      const authKitSignInData = await magicConnectPack.signIn()

      expect(mockUser).toHaveBeenCalled()
      expect(mockConnect).toHaveBeenCalled()
      expect(authKitSignInData).toEqual({
        eoa: '0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf',
        safes: ['0xSafe1', '0xSafe2']
      })
    })
  })

  describe('signOut()', () => {
    it('should call the disconnect() method', async () => {
      await magicConnectPack.signOut()

      expect(magicConnectPack.getProvider()).toBeNull()
      expect(mockLogout).toHaveBeenCalled()
    })
  })

  describe('getProvider()', () => {
    it('should return null if not signed in', async () => {
      expect(magicConnectPack.getProvider()).toBeNull()
    })

    it('should return the provider after signIn', async () => {
      testingUtils.mockAccounts(['0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf'])

      await magicConnectPack.signIn()

      expect(magicConnectPack.getProvider()).toEqual(mockProvider)
    })
  })

  describe('getUserInfo()', () => {
    it('should call requestUserInfoWithUI() method asking for email permissions', async () => {
      expect(await magicConnectPack.getUserInfo()).toEqual({ email: 'mockMail@mail.com' })
      expect(magicConnectPack?.magicSdk?.wallet.requestUserInfoWithUI).toHaveBeenCalledWith(
        expect.objectContaining({ scope: { email: 'required' } })
      )
    })
  })

  describe('subscribe()/unsubscribe()', () => {
    it('should allow to subscribe to events', async () => {
      const signedIn = jest.fn()
      const signedOut = jest.fn()

      magicConnectPack.subscribe(MAGIC_EVENT_CONNECTED, signedIn)
      magicConnectPack.subscribe(MAGIC_EVENT_DISCONNECTED, signedOut)

      testingUtils.mockAccounts(['0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf'])

      await magicConnectPack.signIn()

      expect(signedIn).toHaveBeenCalled()

      await magicConnectPack.signOut()

      expect(signedOut).toHaveBeenCalled()
    })

    it('should allow to unsubscribe to events', async () => {
      const signedIn = jest.fn()
      const signedOut = jest.fn()

      magicConnectPack.subscribe(MAGIC_EVENT_CONNECTED, signedIn)
      magicConnectPack.subscribe(MAGIC_EVENT_DISCONNECTED, signedOut)
      magicConnectPack.unsubscribe(MAGIC_EVENT_CONNECTED, signedIn)
      magicConnectPack.unsubscribe(MAGIC_EVENT_DISCONNECTED, signedOut)

      testingUtils.mockAccounts(['0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf'])

      await magicConnectPack.signIn()

      expect(signedIn).toHaveBeenCalledTimes(0)

      await magicConnectPack.signOut()

      expect(signedOut).toHaveBeenCalledTimes(0)
    })
  })
})
