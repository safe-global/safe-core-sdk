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
const SAFE_PROVIDER = {
  provider: 'http://ethereum.provider',
  signer: '0xSignerAddress'
}
const PENDING_TRANSACTIONS = [{ safeTxHash: '0xPendingSafeTxHash' }]

describe('SafeClient', () => {
  let safeClient: SafeClient
  let protocolKit: Safe
  let apiKit: jest.Mocked<SafeApiKit>

  beforeEach(() => {
    protocolKit = new Safe()
    apiKit = new SafeApiKit({ chainId: 1n }) as jest.Mocked<SafeApiKit>

    safeClient = new SafeClient(protocolKit, apiKit)

    protocolKit.getAddress = jest.fn().mockResolvedValue(SAFE_ADDRESS)
    protocolKit.createTransaction = jest.fn().mockResolvedValue(SAFE_TRANSACTION)
    protocolKit.signTransaction = jest.fn().mockResolvedValue(SAFE_TRANSACTION)
    protocolKit.executeTransaction = jest.fn().mockResolvedValue({ hash: ETHEREUM_TX_HASH })
    protocolKit.connect = jest.fn().mockResolvedValue(protocolKit)
    protocolKit.getSafeProvider = jest.fn().mockResolvedValue(SAFE_PROVIDER)
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

  it('should allow to instantiate a SafeClient', () => {
    expect(safeClient).toBeInstanceOf(SafeClient)
    expect(safeClient.protocolKit).toBe(protocolKit)
    expect(safeClient.apiKit).toBe(apiKit)
  })

  describe('send', () => {
    it('should propose the transaction if Safe account exists and has threshold > 1', async () => {
      protocolKit.isSafeDeployed = jest.fn().mockResolvedValue(true)
      protocolKit.getThreshold = jest.fn().mockResolvedValue(2)

      const result = await safeClient.send({ transactions: TRANSACTION_BATCH })

      expect(protocolKit.createTransaction).toHaveBeenCalledWith({
        transactions: TRANSACTION_BATCH
      })

      expect(utils.proposeTransaction).toHaveBeenCalledWith({
        safeTransaction: SAFE_TRANSACTION,
        protocolKit,
        apiKit
      })
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

    it('should execute the transaction if Safe account exists and has threshold === 1', async () => {
      protocolKit.isSafeDeployed = jest.fn().mockResolvedValue(true)
      protocolKit.getThreshold = jest.fn().mockResolvedValue(1)

      const result = await safeClient.send({ transactions: TRANSACTION_BATCH })

      expect(protocolKit.createTransaction).toHaveBeenCalledWith({
        transactions: TRANSACTION_BATCH
      })

      expect(protocolKit.signTransaction).toHaveBeenCalledWith(SAFE_TRANSACTION)
      expect(protocolKit.executeTransaction).toHaveBeenCalledWith(SAFE_TRANSACTION, {})

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

    it('should deploy and propose the transaction if Safe account does not exist and has threshold > 1', async () => {
      protocolKit.isSafeDeployed = jest.fn().mockResolvedValue(false)
      protocolKit.getThreshold = jest.fn().mockResolvedValue(2)

      const result = await safeClient.send({ transactions: TRANSACTION_BATCH })

      expect(protocolKit.createSafeDeploymentTransaction).toHaveBeenCalledWith()
      expect(utils.sendTransaction).toHaveBeenCalledWith({
        transaction: DEPLOYMENT_TRANSACTION,
        protocolKit
      })
      expect(protocolKit.connect).toHaveBeenCalled()
      expect(protocolKit.signTransaction).toHaveBeenCalledWith(SAFE_TRANSACTION)
      expect(utils.proposeTransaction).toHaveBeenCalledWith({
        safeTransaction: SAFE_TRANSACTION,
        protocolKit,
        apiKit
      })
      expect(result).toMatchObject({
        description: MESSAGES[SafeClientTxStatus.DEPLOYED_AND_PENDING_SIGNATURES],
        safeAddress: SAFE_ADDRESS,
        status: SafeClientTxStatus.DEPLOYED_AND_PENDING_SIGNATURES,
        transactions: {
          ethereumTxHash: undefined,
          safeTxHash: SAFE_TX_HASH
        },
        safeAccountDeployment: {
          ethereumTxHash: DEPLOYMENT_ETHEREUM_TX_HASH
        }
      })
    })

    it('should deploy and execute the transaction if Safe account does not exist and has threshold === 1', async () => {
      protocolKit.isSafeDeployed = jest.fn().mockResolvedValue(false)
      protocolKit.getThreshold = jest.fn().mockResolvedValue(1)

      const result = await safeClient.send({ transactions: TRANSACTION_BATCH })

      expect(protocolKit.signTransaction).toHaveBeenCalledWith(SAFE_TRANSACTION)
      expect(protocolKit.wrapSafeTransactionIntoDeploymentBatch).toHaveBeenCalledWith(
        SAFE_TRANSACTION,
        {}
      )
      expect(protocolKit.connect).toHaveBeenCalled()
      expect(result).toMatchObject({
        description: MESSAGES[SafeClientTxStatus.DEPLOYED_AND_EXECUTED],
        safeAddress: SAFE_ADDRESS,
        status: SafeClientTxStatus.DEPLOYED_AND_EXECUTED,
        transactions: {
          ethereumTxHash: DEPLOYMENT_ETHEREUM_TX_HASH,
          safeTxHash: undefined
        },
        safeAccountDeployment: {
          ethereumTxHash: DEPLOYMENT_ETHEREUM_TX_HASH
        }
      })
    })
  })

  describe('confirm', () => {
    it('should confirm the transaction when enough signatures', async () => {
      const TRANSACTION_RESPONSE = {
        confirmations: [{ signature: '0x1' }, { signature: '0x2' }],
        confirmationsRequired: 2
      }

      apiKit.getTransaction = jest.fn().mockResolvedValue(TRANSACTION_RESPONSE)

      const result = await safeClient.confirm({ safeTxHash: SAFE_TX_HASH })

      expect(apiKit.getTransaction).toHaveBeenCalledWith(SAFE_TX_HASH)
      expect(protocolKit.signTransaction).toHaveBeenCalledWith(TRANSACTION_RESPONSE)
      expect(apiKit.confirmTransaction).toHaveBeenCalledWith(SAFE_TX_HASH, undefined)
      expect(protocolKit.executeTransaction).toHaveBeenCalledWith(TRANSACTION_RESPONSE)
      expect(result).toMatchObject({
        description: MESSAGES[SafeClientTxStatus.EXECUTED],
        safeAddress: SAFE_ADDRESS,
        status: SafeClientTxStatus.EXECUTED,
        transactions: {
          ethereumTxHash: ETHEREUM_TX_HASH,
          safeTxHash: SAFE_TX_HASH
        }
      })
    })

    it('should indicate more signatures are required when threshold is not matched', async () => {
      const TRANSACTION_RESPONSE = {
        confirmations: [{ signature: '0x1' }],
        confirmationsRequired: 2
      }

      apiKit.getTransaction = jest.fn().mockResolvedValue(TRANSACTION_RESPONSE)

      const result = await safeClient.confirm({ safeTxHash: SAFE_TX_HASH })

      expect(apiKit.getTransaction).toHaveBeenCalledWith(SAFE_TX_HASH)
      expect(protocolKit.signTransaction).toHaveBeenCalledWith(TRANSACTION_RESPONSE)
      expect(apiKit.confirmTransaction).toHaveBeenCalledWith(SAFE_TX_HASH, undefined)

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
  })

  describe('getPendingTransactions', () => {
    it('should return the pending transactions for the Safe address', async () => {
      apiKit.getPendingTransactions = jest.fn().mockResolvedValue(PENDING_TRANSACTIONS)

      const result = await safeClient.getPendingTransactions()

      expect(protocolKit.getAddress).toHaveBeenCalled()
      expect(apiKit.getPendingTransactions).toHaveBeenCalledWith(SAFE_ADDRESS)
      expect(result).toBe(PENDING_TRANSACTIONS)
    })
  })

  describe('extend', () => {
    it('should enable the extension of the SafeClient with additional functionality', async () => {
      const extendedClient = safeClient.extend(() => ({
        extendedFunction: () => 'extendedFunction',
        extendedProp: 'extendedProp'
      }))

      expect(extendedClient).toBeInstanceOf(SafeClient)
      expect(extendedClient.extendedFunction()).toEqual('extendedFunction')
      expect(extendedClient.extendedProp).toEqual('extendedProp')
    })
  })
})
