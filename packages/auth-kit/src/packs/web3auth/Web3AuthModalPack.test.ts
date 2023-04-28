import { Web3AuthModalPack } from './Web3AuthModalPack'
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

describe('Web3AuthModalPack', () => {
  let web3AuthModalPack: Web3AuthModalPack

  beforeAll(() => {
    web3AuthModalPack = new Web3AuthModalPack({
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
    await web3AuthModalPack.init()
    expect(web3AuthModalPack.provider).not.toBeNull()
  })

  it('should connect to Web3Auth on signIn', async () => {
    await web3AuthModalPack.signIn()
    expect(web3AuthModalPack.provider).not.toBeNull()
  })

  it('should disconnect from Web3Auth on signOut', async () => {
    await web3AuthModalPack.signOut()
    expect(web3AuthModalPack.provider).toBeNull()
  })
})
