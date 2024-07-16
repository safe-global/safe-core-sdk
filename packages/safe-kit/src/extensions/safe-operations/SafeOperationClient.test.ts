import Safe, * as protocolKitModule from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { Safe4337Pack } from '@safe-global/relay-kit'

import { SafeOperationClient } from './SafeOperationClient'

jest.mock('@safe-global/protocol-kit')
jest.mock('@safe-global/relay-kit')
jest.mock('@safe-global/api-kit')
jest.mock('../../utils', () => {
  return {
    ...jest.requireActual('../../utils'),
    sendTransaction: jest.fn().mockResolvedValue('0xSafeDeploymentEthereumHash'),
    proposeTransaction: jest.fn().mockResolvedValue('0xSafeTxHash'),
    waitSafeTxReceipt: jest.fn()
  }
})

const TRANSACTION = { to: '0xEthereumAddres', value: '0', data: '0x' }
const DEPLOYMENT_TRANSACTION = { to: '0xMultisig', value: '0', data: '0x' }
const TRANSACTION_BATCH = [TRANSACTION]
const SAFE_ADDRESS = '0xSafeAddress'
const SAFE_TX_HASH = '0xSafeTxHash'
const DEPLOYMENT_ETHEREUM_TX_HASH = '0xSafeDeploymentEthereumHash'
const ETHEREUM_TX_HASH = '0xEthereumTxHash'
const SAFE_TRANSACTION = new protocolKitModule.EthSafeTransaction({
  ...TRANSACTION,
  operation: 0,
  safeTxGas: '0',
  baseGas: '0',
  gasPrice: '0',
  gasToken: '0x',
  refundReceiver: '0x',
  nonce: 0
})

describe('SafeOperationClient', () => {
  let safeOperationClient: SafeOperationClient
  let protocolKit: Safe
  let apiKit: jest.Mocked<SafeApiKit>
  let safe4337Pack: jest.Mocked<Safe4337Pack>

  beforeEach(() => {
    protocolKit = new Safe()
    apiKit = new SafeApiKit({ chainId: 1n }) as jest.Mocked<SafeApiKit>
    safe4337Pack = new Safe4337Pack({
      protocolKit,
      bundlerClient: { send: jest.fn().mockResolvedValue('1') } as any,
      bundlerUrl: 'http://bundler.url',
      chainId: 1n,
      paymasterOptions: undefined,
      entryPointAddress: '0xEntryPoint',
      safe4337ModuleAddress: '0xModuleAddress'
    }) as jest.Mocked<Safe4337Pack>

    safeOperationClient = new SafeOperationClient(safe4337Pack, apiKit)

    protocolKit.getAddress = jest.fn().mockResolvedValue(SAFE_ADDRESS)
    protocolKit.createTransaction = jest.fn().mockResolvedValue(SAFE_TRANSACTION)
    protocolKit.signTransaction = jest.fn().mockResolvedValue(SAFE_TRANSACTION)
    protocolKit.executeTransaction = jest.fn().mockResolvedValue({ hash: ETHEREUM_TX_HASH })
    protocolKit.connect = jest.fn().mockResolvedValue(protocolKit)
    protocolKit.getSafeProvider = jest.fn().mockResolvedValue({
      provider: 'http://ethereum.provider',
      signer: '0xSignerAddress'
    })
    protocolKit.createSafeDeploymentTransaction = jest
      .fn()
      .mockResolvedValue(DEPLOYMENT_TRANSACTION)

    protocolKit.wrapSafeTransactionIntoDeploymentBatch = jest
      .fn()
      .mockResolvedValue(DEPLOYMENT_TRANSACTION)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should allow to instantiate a SafeOperationClient', () => {
    expect(safeOperationClient).toBeInstanceOf(SafeOperationClient)
    expect(safeOperationClient.safe4337Pack).toBe(safe4337Pack)
    expect(safeOperationClient.apiKit).toBe(apiKit)
  })

  describe('sendSafeOperation', () => {})
})
