import Safe from '@safe-global/protocol-kit'
import { MetaTransactionData, OperationType, SafeTransaction } from '@safe-global/types-kit'

import { GelatoRelayPack } from './GelatoRelayPack'

const CHAIN_ID = 1n
const ADDRESS = '0x...address'
const SAFE_ADDRESS = '0x...safe-address'
const API_KEY = 'api-key'
const TASK_ID = 'task-id'
const TASK_STATUS = {
  status: 'Included',
  receipt: { transactionHash: '0x...hash' }
}

const SAFE_TRANSACTION = {
  data: {
    operation: OperationType.Call,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    nonce: 0,
    gasToken: '0x',
    refundReceiver: '0x',
    to: ADDRESS,
    value: '0',
    data: '0x'
  }
}

const mockSendTransaction = jest.fn().mockResolvedValue(TASK_ID)
const mockWaitForStatus = jest.fn().mockResolvedValue(TASK_STATUS)

jest.mock('@gelatocloud/gasless', () => {
  return {
    createGelatoEvmRelayerClient: jest.fn().mockImplementation(() => {
      return {
        sendTransaction: mockSendTransaction,
        waitForStatus: mockWaitForStatus
      }
    }),
    sponsored: jest.fn().mockReturnValue({ type: 'sponsored' })
  }
})

jest.mock('@safe-global/protocol-kit', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({}))
  }
})

const safe: Safe = new Safe()

const gelatoRelayPack = new GelatoRelayPack({ apiKey: API_KEY, protocolKit: safe })

describe('GelatoRelayPack', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should allow to check the task status', async () => {
    const status = await gelatoRelayPack.getTaskStatus(TASK_ID)

    expect(status).toBe(TASK_STATUS)
    expect(mockWaitForStatus).toHaveBeenCalledWith({ id: TASK_ID })
  })

  it('should allow to make a sponsored transaction', async () => {
    const response = await gelatoRelayPack.sendSponsorTransaction(SAFE_ADDRESS, '0x', CHAIN_ID)

    expect(response).toBe(TASK_ID)
    expect(mockSendTransaction).toHaveBeenCalledWith({
      chainId: Number(CHAIN_ID),
      to: SAFE_ADDRESS,
      data: '0x',
      payment: { type: 'sponsored' }
    })
  })

  describe('when creating a transaction', () => {
    const transactions: MetaTransactionData[] = [
      {
        to: ADDRESS,
        data: '0x',
        value: '0'
      }
    ]

    beforeEach(() => {
      jest.clearAllMocks()
      safe.getNonce = jest.fn().mockResolvedValue(0)
      safe.createTransaction = jest.fn().mockResolvedValue(SAFE_TRANSACTION)
    })

    it('should create a sponsored transaction', async () => {
      await gelatoRelayPack.createTransaction({ transactions })

      expect(safe.createTransaction).toHaveBeenCalledWith({
        transactions,
        onlyCalls: false,
        options: {
          nonce: 0
        }
      })
    })

    it('should create a transaction with onlyCalls option', async () => {
      await gelatoRelayPack.createTransaction({ transactions, onlyCalls: true })

      expect(safe.createTransaction).toHaveBeenCalledWith({
        transactions,
        onlyCalls: true,
        options: {
          nonce: 0
        }
      })
    })
  })

  describe('executeTransaction', () => {
    const ENCODED_TRANSACTION_DATA = '0x...txData'
    const MULTISEND_ADDRESS = '0x...multiSendAddress'
    const SAFE_DEPLOYMENT_BATCH = {
      to: MULTISEND_ADDRESS,
      value: '0',
      data: '0x...deploymentBatchData'
    }

    beforeEach(() => {
      jest.clearAllMocks()
      safe.isSafeDeployed = jest.fn().mockResolvedValue(true)
      safe.getChainId = jest.fn().mockResolvedValue(CHAIN_ID)
      safe.getAddress = jest.fn().mockResolvedValue(SAFE_ADDRESS)
      safe.getEncodedTransaction = jest.fn().mockResolvedValue(ENCODED_TRANSACTION_DATA)
      safe.wrapSafeTransactionIntoDeploymentBatch = jest
        .fn()
        .mockResolvedValue(SAFE_DEPLOYMENT_BATCH)
    })

    describe('when the Safe is already deployed', () => {
      it('should execute a sponsored relay transaction', async () => {
        const relayTransaction = {
          data: {
            nonce: 0,
            to: ADDRESS,
            value: '0',
            data: '0x'
          }
        }

        const taskId = await gelatoRelayPack.executeTransaction({
          executable: relayTransaction as SafeTransaction
        })

        expect(taskId).toBe(TASK_ID)
        expect(mockSendTransaction).toHaveBeenCalledWith({
          chainId: Number(CHAIN_ID),
          to: SAFE_ADDRESS,
          data: ENCODED_TRANSACTION_DATA,
          payment: { type: 'sponsored' }
        })
        // no counterfactual deployment present
        expect(safe.wrapSafeTransactionIntoDeploymentBatch).not.toHaveBeenCalled()
      })
    })

    describe('when the Safe is not deployed (counterfactual deployment)', () => {
      it('should execute a sponsored relay transaction & counterfactual deployment', async () => {
        // Safe is not deployed
        safe.isSafeDeployed = jest.fn().mockResolvedValue(false)

        const relayTransaction = {
          data: {
            nonce: 0,
            to: ADDRESS,
            value: '0',
            data: '0x'
          }
        }

        const taskId = await gelatoRelayPack.executeTransaction({
          executable: relayTransaction as SafeTransaction
        })

        expect(taskId).toBe(TASK_ID)
        expect(mockSendTransaction).toHaveBeenCalledWith({
          chainId: Number(CHAIN_ID),
          to: MULTISEND_ADDRESS, // multiSend contract as a target address because a counterfactual deployment is present
          data: SAFE_DEPLOYMENT_BATCH.data,
          payment: { type: 'sponsored' }
        })
        // counterfactual deployment is present
        expect(safe.wrapSafeTransactionIntoDeploymentBatch).toHaveBeenCalled()
      })
    })
  })
})
