import dotenv from 'dotenv'
import Safe from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { offChainMessages } from './offChainMessages'
import { SafeClient } from '../../SafeClient'

jest.mock('@safe-global/protocol-kit')
jest.mock('@safe-global/api-kit')
jest.mock('../../utils', () => {
  return {
    ...jest.requireActual('../../utils'),
    sendTransaction: jest.fn().mockResolvedValue('0xSafeDeploymentEthereumHash'),
    proposeTransaction: jest.fn().mockResolvedValue('0xSafeTxHash'),
    waitSafeTxReceipt: jest.fn()
  }
})

dotenv.config()
const { TX_SERVICE_API_KEY } = process.env

describe('onChainMessages', () => {
  let protocolKit: Safe
  let apiKit: jest.Mocked<SafeApiKit>
  let safeClient: SafeClient

  beforeEach(() => {
    protocolKit = new Safe()
    apiKit = new SafeApiKit({
      chainId: 1n,
      txServiceApiKey: TX_SERVICE_API_KEY || ''
    }) as jest.Mocked<SafeApiKit>
    safeClient = new SafeClient(protocolKit, apiKit)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should extend the SafeClient with the offChainMessages methods', async () => {
    const safeMessagesClient = safeClient.extend(offChainMessages())

    expect(safeMessagesClient.sendOffChainMessage).toBeDefined()
    expect(safeMessagesClient.confirmOffChainMessage).toBeDefined()
    expect(safeMessagesClient.getPendingOffChainMessages).toBeDefined()
  })
})
