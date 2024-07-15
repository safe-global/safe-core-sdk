import Safe, * as protocolKitModule from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'

import * as utils from './utils'
import { SafeClient } from './SafeClient'
import { MESSAGES, SafeClientTxStatus } from './constants'

jest.mock('@safe-global/protocol-kit')
jest.mock('@safe-global/api-kit')
jest.mock('./utils', () => {
  return {
    ...jest.requireActual('./utils'),
    sendTransaction: jest.fn(),
    proposeTransaction: jest.fn().mockResolvedValue('0xSafeTxHash'),
    waitSafeTxReceipt: jest.fn()
  }
})

const TRANSACTION = { to: '0x123', value: '100', data: '0x' }
const TRANSACTION_BATCH = [TRANSACTION]
const SAFE_ADDRESS = '0xSafeAddress'
const SAFE_TX_HASH = '0xSafeTxHash'
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

describe('SafeClient', () => {
  let safeClient: SafeClient
  let protocolKit: Safe
  let apiKit: jest.Mocked<SafeApiKit>

  beforeEach(() => {
    protocolKit = new Safe()
    apiKit = new SafeApiKit({ chainId: 1n }) as jest.Mocked<SafeApiKit>

    safeClient = new SafeClient(protocolKit, apiKit)
  })

  it('should allow to instantiate a SafeClient', () => {
    expect(safeClient).toBeInstanceOf(SafeClient)
    expect(safeClient.protocolKit).toBe(protocolKit)
    expect(safeClient.apiKit).toBe(apiKit)
  })

  describe('send', () => {
    it('should propose the transaction if Safe account exists and has threshold > 1', async () => {
      protocolKit.isSafeDeployed = jest.fn().mockResolvedValue(true)
      protocolKit.getThreshold = jest.fn().mockResolvedValue(2)
      protocolKit.getAddress = jest.fn().mockResolvedValue(SAFE_ADDRESS)
      protocolKit.createTransaction = jest.fn().mockResolvedValue(SAFE_TRANSACTION)

      const result = await safeClient.send(TRANSACTION_BATCH)

      expect(protocolKit.createTransaction).toHaveBeenCalledWith({
        transactions: TRANSACTION_BATCH
      })

      expect(utils.proposeTransaction).toHaveBeenCalledWith(SAFE_TRANSACTION, protocolKit, apiKit)
      expect(result).toMatchObject({
        description: MESSAGES[SafeClientTxStatus.PENDING_SIGNATURES],
        safeAddress: SAFE_ADDRESS,
        status: SafeClientTxStatus.PENDING_SIGNATURES,
        transactions: {
          ethereumTxHash: undefined,
          safeTxHash: SAFE_TX_HASH
        }
      })
    })

    it('should execute the transaction if Safe account exists and has threshold 1', async () => {
      protocolKit.isSafeDeployed = jest.fn().mockResolvedValue(true)
      protocolKit.getThreshold = jest.fn().mockResolvedValue(1)
      protocolKit.getAddress = jest.fn().mockResolvedValue(SAFE_ADDRESS)
      protocolKit.executeTransaction = jest.fn().mockResolvedValue({ hash: ETHEREUM_TX_HASH })
      protocolKit.signTransaction = jest.fn().mockResolvedValue(SAFE_TRANSACTION)
      protocolKit.createTransaction = jest.fn().mockResolvedValue(SAFE_TRANSACTION)

      const result = await safeClient.send(TRANSACTION_BATCH)

      expect(protocolKit.createTransaction).toHaveBeenCalledWith({
        transactions: TRANSACTION_BATCH
      })

      expect(protocolKit.signTransaction).toHaveBeenCalledWith(SAFE_TRANSACTION)
      expect(protocolKit.executeTransaction).toHaveBeenCalledWith(SAFE_TRANSACTION, undefined)

      expect(result).toMatchObject({
        description: MESSAGES[SafeClientTxStatus.EXECUTED],
        safeAddress: SAFE_ADDRESS,
        status: SafeClientTxStatus.EXECUTED,
        transactions: {
          ethereumTxHash: ETHEREUM_TX_HASH,
          safeTxHash: undefined
        }
      })
    })
  })
})
