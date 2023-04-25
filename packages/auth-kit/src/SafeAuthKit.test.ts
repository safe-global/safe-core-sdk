import { ADAPTER_EVENTS, CHAIN_NAMESPACES } from '@web3auth/base'
import * as web3AuthModal from '@web3auth/modal'
import { Web3AuthOptions } from '@web3auth/modal'
import { SafeAuthKit } from './SafeAuthKit'
import { Web3AuthModalPack } from './packs/web3auth/Web3AuthModalPack'

import { generateTestingUtils } from 'eth-testing'
import EventEmitter from 'events'

const testingUtils = generateTestingUtils({ providerType: 'MetaMask' })

const mockProvider = testingUtils.getProvider()
const mockInitModal = jest.fn()
const mockConnect = jest.fn().mockImplementation(() => {
  eventEmitter.emit(ADAPTER_EVENTS.CONNECTED)
  return Promise.resolve(mockProvider)
})
const eventEmitter = new EventEmitter()
const mockLogout = jest
  .fn()
  .mockImplementation(() => eventEmitter.emit(ADAPTER_EVENTS.DISCONNECTED))
const mockAddEventListener = jest
  .fn()
  .mockImplementation((event, listener) => eventEmitter.on(event, listener))
const mockRemoveEventListener = jest
  .fn()
  .mockImplementation((event, listener) => eventEmitter.off(event, listener))

jest.mock('@web3auth/modal', () => {
  return {
    Web3Auth: jest.fn().mockImplementation(() => {
      return {
        provider: mockProvider,
        initModal: mockInitModal,
        connect: mockConnect,
        configureAdapter: jest.fn(),
        logout: mockLogout,
        on: mockAddEventListener,
        off: mockRemoveEventListener
      }
    })
  }
})

jest.mock('@safe-global/api-kit', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSafesByOwner: jest.fn().mockImplementation(() => {
        return Promise.resolve({ safes: ['0x123', '0x456'] })
      })
    }
  })
})

const config: Web3AuthOptions = {
  clientId: '123',
  web3AuthNetwork: 'testnet',
  chainConfig: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: '0x5',
    rpcTarget: `https://goerli.infura.io/v3/api-key`
  }
}

describe('SafeAuthKit', () => {
  let web3AuthModalPack: Web3AuthModalPack

  beforeEach(() => {
    web3AuthModalPack = new Web3AuthModalPack(config)
  })

  it('should create a SafeAuthKit instance', async () => {
    const safeAuthKit = await SafeAuthKit.init(web3AuthModalPack)

    expect(safeAuthKit).toBeInstanceOf(SafeAuthKit)
    expect(safeAuthKit?.safeAuthData).toBeUndefined()
  })

  it('should clean the auth data when signing out', async () => {
    const safeAuthKit = await SafeAuthKit.init(web3AuthModalPack)

    testingUtils.lowLevel.mockRequest('eth_accounts', [
      '0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf'
    ])

    await safeAuthKit?.signIn()
    await safeAuthKit?.signOut()

    expect(safeAuthKit?.safeAuthData).toBeUndefined()
  })

  it('should allow to get the provider', async () => {
    const safeAuthKit = await SafeAuthKit.init(web3AuthModalPack)

    expect(safeAuthKit?.getProvider()).toBe(mockProvider)
  })

  it('should allow to subscribe to events', async () => {
    const safeAuthKit = await SafeAuthKit.init(web3AuthModalPack)
    const signedIn = jest.fn()
    const signedOut = jest.fn()

    safeAuthKit?.subscribe(ADAPTER_EVENTS.CONNECTED, signedIn)
    safeAuthKit?.subscribe(ADAPTER_EVENTS.DISCONNECTED, signedOut)

    testingUtils.lowLevel.mockRequest('eth_accounts', [
      '0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf'
    ])

    await safeAuthKit?.signIn()

    expect(signedIn).toHaveBeenCalled()

    await safeAuthKit?.signOut()

    expect(signedOut).toHaveBeenCalled()
  })

  it('should allow to unsubscribe to events', async () => {
    const safeAuthKit = await SafeAuthKit.init(web3AuthModalPack)
    const signedIn = jest.fn()
    const signedOut = jest.fn()

    safeAuthKit?.subscribe(ADAPTER_EVENTS.CONNECTED, signedIn)
    safeAuthKit?.subscribe(ADAPTER_EVENTS.DISCONNECTED, signedOut)
    safeAuthKit?.unsubscribe(ADAPTER_EVENTS.CONNECTED, signedIn)
    safeAuthKit?.unsubscribe(ADAPTER_EVENTS.DISCONNECTED, signedOut)

    testingUtils.lowLevel.mockRequest('eth_accounts', [
      '0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf'
    ])

    await safeAuthKit?.signIn()

    expect(signedIn).toHaveBeenCalledTimes(0)

    await safeAuthKit?.signOut()

    expect(signedOut).toHaveBeenCalledTimes(0)
  })

  describe('using the Web3AuthModalPack', () => {
    const MockedWeb3Auth = jest.mocked(web3AuthModal.Web3Auth)

    beforeEach(() => {
      jest.clearAllMocks()
      testingUtils.clearAllMocks()
      mockInitModal.mockClear()
      mockConnect.mockClear()
    })

    it('should call the initModal method after create a Web3Auth instance', async () => {
      await SafeAuthKit.init(web3AuthModalPack)

      expect(MockedWeb3Auth).toHaveBeenCalledTimes(1)
      expect(mockInitModal).toHaveBeenCalledTimes(1)
      expect(MockedWeb3Auth).toHaveBeenCalledWith(expect.objectContaining(config))
    })

    it('should return the associated eoa when the user is signed in', async () => {
      const safeAuthKit = await SafeAuthKit.init(web3AuthModalPack)

      testingUtils.lowLevel.mockRequest('eth_accounts', [
        '0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf'
      ])

      const data = await safeAuthKit?.signIn()

      expect(data).toEqual({
        eoa: '0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf',
        safes: undefined
      })
    })
  })

  describe('when adding the txServiceUrl to the config', () => {
    it('should return the associated eoa and safes when the user is signed in', async () => {
      const safeAuthKit = await SafeAuthKit.init(web3AuthModalPack, {
        txServiceUrl: 'https://safe-transaction.safe.global'
      })

      testingUtils.lowLevel.mockRequest('eth_accounts', [
        '0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf'
      ])

      const data = await safeAuthKit?.signIn()

      expect(data).toEqual({
        eoa: '0xf61B443A155b07D2b2cAeA2d99715dC84E839EEf',
        safes: ['0x123', '0x456']
      })
    })
  })
})
