import { Web3AuthModalPack } from './Web3AuthModalPack'
import { generateTestingUtils } from 'eth-testing'
import EventEmitter from 'events'
import { ADAPTER_EVENTS, CHAIN_NAMESPACES, WALLET_ADAPTERS } from '@web3auth/base'
import { Web3AuthOptions } from '@web3auth/modal'
import { AuthKitBasePack } from '../../AuthKitBasePack'

const testingUtils = generateTestingUtils({ providerType: 'MetaMask' })
const mockProvider = testingUtils.getProvider()
const mockInitModal = jest.fn()
const mockConnect = jest.fn().mockImplementation(() => {
  eventEmitter.emit(ADAPTER_EVENTS.CONNECTED)
  return Promise.resolve(mockProvider)
})
const eventEmitter = new EventEmitter()
const mockConfigureAdapter = jest.fn()
const mockLogout = jest
  .fn()
  .mockImplementation(() => eventEmitter.emit(ADAPTER_EVENTS.DISCONNECTED))
const mockAddEventListener = jest
  .fn()
  .mockImplementation((event, listener) => eventEmitter.on(event, listener))
const mockRemoveEventListener = jest
  .fn()
  .mockImplementation((event, listener) => eventEmitter.off(event, listener))

jest.mock('@safe-global/api-kit', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSafesByOwner: jest.fn().mockImplementation(() => {
        return Promise.resolve({ safes: ['0xSafe1', '0xSafe2'] })
      })
    }
  })
})

jest.mock('@web3auth/modal', () => {
  return {
    Web3Auth: jest.fn().mockImplementation(() => {
      return {
        getProvider: jest.fn().mockReturnValue(mockProvider),
        initModal: mockInitModal,
        connect: mockConnect,
        configureAdapter: mockConfigureAdapter,
        logout: mockLogout,
        on: mockAddEventListener,
        off: mockRemoveEventListener,
        getUserInfo: jest.fn().mockResolvedValue({
          email: 'mockMail@mail.com'
        })
      }
    })
  }
})

const web3AuthOptions: Web3AuthOptions = {
  clientId: '123',
  web3AuthNetwork: 'testnet',
  chainConfig: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: '0x5',
    rpcTarget: `https://goerli.infura.io/v3/api-key`
  }
}

const modalConfig = {
  [WALLET_ADAPTERS.METAMASK]: {
    label: 'metamask',
    showOnDesktop: true,
    showOnMobile: false
  }
}

describe('Web3AuthModalPack', () => {
  let web3AuthModalPack: Web3AuthModalPack

  beforeAll(async () => {
    web3AuthModalPack = new Web3AuthModalPack({
      txServiceUrl: 'https://txservice-url.com'
    })

    await web3AuthModalPack.init({
      options: web3AuthOptions
    })
  })

  beforeEach(() => {
    jest.clearAllMocks()
    testingUtils.clearAllMocks()
    mockInitModal.mockClear()
    mockConnect.mockClear()
  })

  describe('init()', () => {
    it('should initialize Web3Auth', async () => {
      expect(web3AuthModalPack.getProvider()).not.toBeNull()
      expect(web3AuthModalPack).toBeInstanceOf(Web3AuthModalPack)
      expect(web3AuthModalPack).toBeInstanceOf(AuthKitBasePack)
    })

    it('should configure the adapters', async () => {
      await web3AuthModalPack.init({
        options: web3AuthOptions,
        // @ts-expect-error - Does not match IAdapter interface
        adapters: [jest.fn(), jest.fn()]
      })

      expect(mockConfigureAdapter).toHaveBeenCalledTimes(2)
    })

    it('should call initModal()', async () => {
      await web3AuthModalPack.init({
        options: web3AuthOptions,
        modalConfig
      })

      expect(mockInitModal).toHaveBeenCalledWith(expect.objectContaining({ modalConfig }))
    })

    it('should initialize the provider', async () => {
      testingUtils.mockAccounts(['0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf'])

      await web3AuthModalPack.init({
        options: web3AuthOptions,
        modalConfig
      })

      const authKitSignInData = await web3AuthModalPack.signIn()

      expect(web3AuthModalPack.getProvider()).toBe(mockProvider)
    })
  })

  describe('signIn()', () => {
    it('should call the connect() method', async () => {
      testingUtils.mockAccounts(['0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf'])

      const authKitSignInData = await web3AuthModalPack.signIn()

      expect(mockConnect).toHaveBeenCalled()
      expect(authKitSignInData).toEqual({
        eoa: '0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf',
        safes: ['0xSafe1', '0xSafe2']
      })
    })
  })

  describe('signOut()', () => {
    it('should call the logout() method', async () => {
      await web3AuthModalPack.signOut()

      expect(web3AuthModalPack.getProvider()).toBeNull()
      expect(mockLogout).toHaveBeenCalled()
    })
  })

  describe('getProvider()', () => {
    it('should return null if not signed in', async () => {
      expect(web3AuthModalPack.getProvider()).toBeNull()
    })

    it('should return the provider after signIn', async () => {
      testingUtils.mockAccounts(['0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf'])

      await web3AuthModalPack.signIn()

      expect(web3AuthModalPack.getProvider()).toEqual(mockProvider)
    })
  })

  describe('getUserInfo()', () => {
    it('should return null if not signed in', async () => {
      expect(await web3AuthModalPack.getUserInfo()).toEqual({ email: 'mockMail@mail.com' })
    })
  })

  describe('subscribe()/unsubscribe()', () => {
    it('should allow to subscribe to events', async () => {
      const signedIn = jest.fn()
      const signedOut = jest.fn()

      web3AuthModalPack.subscribe(ADAPTER_EVENTS.CONNECTED, signedIn)
      web3AuthModalPack.subscribe(ADAPTER_EVENTS.DISCONNECTED, signedOut)

      testingUtils.mockAccounts(['0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf'])

      await web3AuthModalPack.signIn()

      expect(signedIn).toHaveBeenCalled()

      await web3AuthModalPack.signOut()

      expect(signedOut).toHaveBeenCalled()
    })

    it('should allow to unsubscribe to events', async () => {
      const signedIn = jest.fn()
      const signedOut = jest.fn()

      web3AuthModalPack.subscribe(ADAPTER_EVENTS.CONNECTED, signedIn)
      web3AuthModalPack.subscribe(ADAPTER_EVENTS.DISCONNECTED, signedOut)
      web3AuthModalPack.unsubscribe(ADAPTER_EVENTS.CONNECTED, signedIn)
      web3AuthModalPack.unsubscribe(ADAPTER_EVENTS.DISCONNECTED, signedOut)

      testingUtils.mockAccounts(['0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf'])

      await web3AuthModalPack.signIn()

      expect(signedIn).toHaveBeenCalledTimes(0)

      await web3AuthModalPack.signOut()

      expect(signedOut).toHaveBeenCalledTimes(0)
    })
  })
})
