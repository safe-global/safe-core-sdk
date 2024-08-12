import Safe from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { Safe4337Pack } from '@safe-global/relay-kit'

import { safeOperations } from './safeOperations'
import { SafeClient } from '../../SafeClient'

jest.mock('@safe-global/protocol-kit')
jest.mock('@safe-global/api-kit')
jest.mock('@safe-global/relay-kit')
jest.mock('../../utils', () => {
  return {
    ...jest.requireActual('../../utils'),
    sendTransaction: jest.fn().mockResolvedValue('0xSafeDeploymentEthereumHash'),
    proposeTransaction: jest.fn().mockResolvedValue('0xSafeTxHash'),
    waitSafeTxReceipt: jest.fn()
  }
})

const SAFE_PROVIDER = {
  provider: 'http://ethereum.provider',
  signer: '0xSignerAddress'
}

describe('safeOperations', () => {
  let protocolKit: Safe
  let apiKit: jest.Mocked<SafeApiKit>
  let safeClient: SafeClient

  beforeEach(() => {
    protocolKit = new Safe()
    apiKit = new SafeApiKit({ chainId: 1n }) as jest.Mocked<SafeApiKit>
    safeClient = new SafeClient(protocolKit, apiKit)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should extend the SafeClient with the onChainMessages methods', async () => {
    protocolKit.isSafeDeployed = jest.fn().mockResolvedValue(false)
    protocolKit.getSafeProvider = jest.fn().mockResolvedValue(SAFE_PROVIDER)
    protocolKit.getPredictedSafe = jest.fn().mockReturnValue({
      safeDeploymentConfig: {},
      safeAccountConfig: {
        owners: ['0xOwnerAddress'],
        threshold: 1
      }
    })
    jest.spyOn(Safe4337Pack, 'init').mockResolvedValue({ protocolKit } as any)

    const safeOperationsClient = await safeClient.extend(
      safeOperations({ bundlerUrl: 'http://bundler.url' })
    )

    expect(Safe4337Pack.init).toHaveBeenCalledWith(
      expect.objectContaining({
        bundlerUrl: 'http://bundler.url',
        options: {
          owners: ['0xOwnerAddress'],
          threshold: 1
        }
      })
    )
    expect(safeOperationsClient.sendSafeOperation).toBeDefined()
    expect(safeOperationsClient.confirmSafeOperation).toBeDefined()
    expect(safeOperationsClient.getPendingSafeOperations).toBeDefined()
  })
})
