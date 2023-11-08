import { SUPPORTED_NETWORKS } from '@toruslabs/ethereum-controllers'
import { SafeAuthPack } from './SafeAuthPack'
import { generateTestingUtils } from 'eth-testing'
import { AuthKitBasePack } from '../../AuthKitBasePack'
import { SafeAuthInitOptions } from './types'

const testingUtils = generateTestingUtils({ providerType: 'MetaMask' })
const mockProvider = testingUtils.getProvider()
const mockInit = jest.fn()
const mockLogin = jest.fn()
const mockLogout = jest.fn()

jest.mock('@safe-global/api-kit', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSafesByOwner: jest.fn().mockImplementation(() => {
        return Promise.resolve({ safes: ['0xSafe1', '0xSafe2'] })
      })
    }
  })
})

jest.mock('@web3auth/ws-embed', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return {
        provider: mockProvider,
        init: mockInit,
        login: mockLogin,
        logout: mockLogout,
        getUserInfo: jest.fn().mockResolvedValue({
          email: 'mockMail@mail.com'
        })
      }
    })
  }
})

const safeAuthInitOptions: SafeAuthInitOptions = {
  enableLogging: true,
  showWidgetButton: false,
  chainConfig: SUPPORTED_NETWORKS['0x64']
}

describe('SafeAuthPacl', () => {
  let safeAuthPack: SafeAuthPack

  beforeAll(async () => {
    safeAuthPack = new SafeAuthPack({
      txServiceUrl: 'https://txservice-url.com'
    })

    await safeAuthPack.init(safeAuthInitOptions)
  })

  beforeEach(() => {
    jest.clearAllMocks()
    testingUtils.clearAllMocks()
    mockInit.mockClear()
    mockLogin.mockClear()
  })

  describe('init()', () => {
    it('should initialize SafeAuth', async () => {
      expect(safeAuthPack.getProvider()).not.toBeNull()
      expect(safeAuthPack).toBeInstanceOf(SafeAuthPack)
      expect(safeAuthPack).toBeInstanceOf(AuthKitBasePack)
    })

    it('should call torus init()', async () => {
      await safeAuthPack.init(safeAuthInitOptions)
      console.log(safeAuthPack)
      expect(mockInit).toHaveBeenCalledWith(expect.objectContaining(safeAuthInitOptions))
    })

    it('should initialize the provider', async () => {
      await safeAuthPack.init(safeAuthInitOptions)

      expect(safeAuthPack.getProvider()).toBe(mockProvider)
    })
  })

  describe('signIn()', () => {
    it('should call the login() method', async () => {
      testingUtils.mockAccounts(['0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf'])

      const authKitSignInData = await safeAuthPack.signIn()

      expect(mockLogin).toHaveBeenCalled()
      expect(authKitSignInData).toEqual({
        eoa: '0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf',
        safes: ['0xSafe1', '0xSafe2']
      })
    })
  })

  describe('signOut()', () => {
    it('should call the logout() method', async () => {
      await safeAuthPack.signOut()

      expect(safeAuthPack.getProvider()).toBeNull()
      expect(mockLogout).toHaveBeenCalled()
    })
  })

  describe('getProvider()', () => {
    it('should return null if not signed in', async () => {
      expect(safeAuthPack.getProvider()).toBeNull()
    })

    it('should return the provider after initialization', async () => {
      testingUtils.mockAccounts(['0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf'])

      await safeAuthPack.init(safeAuthInitOptions)

      expect(safeAuthPack.getProvider()).toEqual(mockProvider)
    })
  })

  describe('getUserInfo()', () => {
    it('should return the provider information', async () => {
      expect(await safeAuthPack.getUserInfo()).toEqual({ email: 'mockMail@mail.com' })
    })
  })
})
