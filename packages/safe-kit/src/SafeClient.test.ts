import { SafeClient } from './SafeClient' // Adjust the import path based on your directory structure
import Safe from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'

// Mock dependencies
jest.mock('@safe-global/protocol-kit')
jest.mock('@safe-global/api-kit')
jest.mock('@safe-global/safe-kit/utils', () => ({
  createSafeClientResult: jest.fn(),
  sendTransaction: jest.fn(),
  proposeTransaction: jest.fn(),
  waitSafeTxReceipt: jest.fn()
}))

describe('SafeClient', () => {
  let safeClient: SafeClient
  let protocolKit: jest.Mocked<Safe>
  let apiKit: jest.Mocked<SafeApiKit>

  beforeEach(() => {
    protocolKit = new Safe() as jest.Mocked<Safe>
    apiKit = new SafeApiKit({ chainId: 1n }) as jest.Mocked<SafeApiKit>
    safeClient = new SafeClient(protocolKit, apiKit)
  })

  it('should allow to instantiate a SafeClient', () => {
    expect(safeClient).toBeInstanceOf(SafeClient)
  })
})
