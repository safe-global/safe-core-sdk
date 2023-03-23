import { Web3AuthAdapter } from './Web3AuthAdapter'
import { generateTestingUtils } from 'eth-testing'
import { CHAIN_NAMESPACES } from '@web3auth/base'

const testingUtils = generateTestingUtils({ providerType: 'MetaMask' })
const mockProvider = testingUtils.getProvider()
const mockInitModal = jest.fn()
const mockConnect = jest.fn().mockResolvedValue(mockProvider)

jest.mock('@web3auth/modal', () => {
  return {
    Web3Auth: jest.fn().mockImplementation(() => {
      return {
        provider: mockProvider,
        initModal: mockInitModal,
        connect: mockConnect,
        configureAdapter: jest.fn(),
        logout: jest.fn()
      }
    })
  }
})

describe('Web3AuthAdapter', () => {
  let adapter: Web3AuthAdapter

  beforeAll(() => {
    adapter = new Web3AuthAdapter({
      clientId: '123',
      web3AuthNetwork: 'mainnet',
      chainConfig: {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: '0x5',
        rpcTarget: `https://goerli.infura.io/v3/api-key`
      }
    })
  })

  beforeEach(() => {
    jest.clearAllMocks()
    testingUtils.clearAllMocks()
    mockInitModal.mockClear()
    mockConnect.mockClear()
  })

  it('should initialize Web3Auth on init', async () => {
    await adapter.init()
    expect(adapter.provider).not.toBeNull()
  })

  it('should connect to Web3Auth on signIn', async () => {
    await adapter.signIn()
    expect(adapter.provider).not.toBeNull()
  })

  it('should disconnect from Web3Auth on signOut', async () => {
    await adapter.signOut()
    expect(adapter.provider).toBeNull()
  })
})
