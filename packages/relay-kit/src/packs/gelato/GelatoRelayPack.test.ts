import { BigNumber } from '@ethersproject/bignumber'
import { TransactionStatusResponse } from '@gelatonetwork/relay-sdk'
import Safe, {
  isGasTokenCompatibleWithHandlePayment,
  estimateTxBaseGas,
  estimateSafeTxGas,
  estimateSafeDeploymentGas,
  createERC20TokenTransferTransaction
} from '@safe-global/protocol-kit'
import { MetaTransactionData, OperationType } from '@safe-global/safe-core-sdk-types'

import {
  GELATO_FEE_COLLECTOR,
  GELATO_NATIVE_TOKEN_ADDRESS,
  ZERO_ADDRESS
} from '@safe-global/relay-kit/constants'
import { GelatoRelayPack } from './GelatoRelayPack'
import { SafeTransaction } from 'packages/safe-core-sdk-types/dist/src'

enum TaskState {
  CheckPending = 'CheckPending'
}

const CHAIN_ID = 1
const ADDRESS = '0x...address'
const GAS_TOKEN = '0x...gasToken'
const SAFE_ADDRESS = '0x...safe-address'
const API_KEY = 'api-key'
const FEE_ESTIMATION = BigNumber.from(100_000)
const BASEGAS_ESTIMATION = '20000'
const SAFETXGAS_ESTIMATION = '10000'
const SAFE_DEPLOYMENT_GAS_ESTIMATION = '30000'
const TASK_ID = 'task-id'
const TASK_STATUS: TransactionStatusResponse = {
  chainId: CHAIN_ID,
  taskState: TaskState.CheckPending,
  taskId: TASK_ID,
  creationDate: Date.now().toString()
}
const RELAY_RESPONSE = {
  taskId: TASK_ID
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

const mockGetEstimateFee = jest.fn().mockResolvedValue(FEE_ESTIMATION)
const mockGetTaskStatus = jest.fn().mockResolvedValue(TASK_STATUS)
const mockSponsoredCall = jest.fn().mockResolvedValue(RELAY_RESPONSE)
const mockCallWithSyncFee = jest.fn().mockResolvedValue(RELAY_RESPONSE)

jest.mock('@gelatonetwork/relay-sdk', () => {
  return {
    GelatoRelay: jest.fn().mockImplementation(() => {
      return {
        getEstimatedFee: mockGetEstimateFee,
        getTaskStatus: mockGetTaskStatus,
        sponsoredCall: mockSponsoredCall,
        callWithSyncFee: mockCallWithSyncFee
      }
    })
  }
})

jest.mock('@safe-global/protocol-kit')

// Cast the import to jest.Mocked type
const mockEstimateTxBaseGas = estimateTxBaseGas as jest.MockedFunction<typeof estimateTxBaseGas>
const mockEstimateSafeTxGas = estimateSafeTxGas as jest.MockedFunction<typeof estimateSafeTxGas>
const mockEstimateSafeDeploymentGas = estimateSafeDeploymentGas as jest.MockedFunction<
  typeof estimateSafeDeploymentGas
>
const mockCreateERC20TokenTransferTransaction =
  createERC20TokenTransferTransaction as jest.MockedFunction<
    typeof createERC20TokenTransferTransaction
  >
const mockedIsGasTokenCompatibleWithHandlePayment =
  isGasTokenCompatibleWithHandlePayment as jest.MockedFunction<
    typeof isGasTokenCompatibleWithHandlePayment
  >

jest.doMock('@safe-global/protocol-kit', () => ({
  ...jest.requireActual('@safe-global/protocol-kit'),
  estimateTxBaseGas: mockEstimateTxBaseGas,
  estimateSafeTxGas: mockEstimateSafeTxGas,
  estimateSafeDeploymentGas: mockEstimateSafeDeploymentGas,
  createERC20TokenTransferTransaction: mockCreateERC20TokenTransferTransaction,
  isGasTokenCompatibleWithHandlePayment: mockedIsGasTokenCompatibleWithHandlePayment
}))

const gelatoRelayPack = new GelatoRelayPack(API_KEY)

describe('GelatoRelayPack', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEstimateTxBaseGas.mockResolvedValue(Promise.resolve(BASEGAS_ESTIMATION))
    mockEstimateSafeTxGas.mockResolvedValue(Promise.resolve(SAFETXGAS_ESTIMATION))
    mockEstimateSafeDeploymentGas.mockResolvedValue(Promise.resolve(SAFE_DEPLOYMENT_GAS_ESTIMATION))
  })

  it('should allow to get a fee estimation', async () => {
    const chainId = 1
    const gasLimit = '100000'
    const gasToken = '0x0000000000000000000000000000000000000000'
    const estimation = await gelatoRelayPack.getEstimateFee(chainId, gasLimit, gasToken)

    expect(estimation).toBe(FEE_ESTIMATION.toString())
    expect(mockGetEstimateFee).toHaveBeenCalledWith(
      chainId,
      GELATO_NATIVE_TOKEN_ADDRESS,
      BigNumber.from(gasLimit),
      false
    )
    expect(BigNumber.from(estimation).gt(BigNumber.from(0))).toBe(true)
  })

  it('should allow to check the task status', async () => {
    const taskId = 'task-id'
    const status = await gelatoRelayPack.getTaskStatus(taskId)

    expect(status).toBe(TASK_STATUS)
    expect(mockGetTaskStatus).toHaveBeenCalledWith('task-id')
  })

  it('should allow to make a sponsored transaction', async () => {
    const response = await gelatoRelayPack.sendSponsorTransaction(SAFE_ADDRESS, '0x', CHAIN_ID)

    expect(response).toBe(RELAY_RESPONSE)
    expect(mockSponsoredCall).toHaveBeenCalledWith(
      {
        chainId: CHAIN_ID,
        target: SAFE_ADDRESS,
        data: '0x'
      },
      API_KEY
    )
  })

  it('should throw an error when trying to do a sponsored transaction without an api key', async () => {
    const relayPack = new GelatoRelayPack()
    await expect(
      relayPack.sendSponsorTransaction(SAFE_ADDRESS, '0x', CHAIN_ID)
    ).rejects.toThrowError('API key not defined')
  })

  describe('when creating a relayed transaction', () => {
    describe('When gas limit is manually defined', () => {
      let relayPack: GelatoRelayPack
      const safe: Safe = new Safe()
      const transactions: MetaTransactionData[] = [
        {
          to: ADDRESS,
          data: '0x',
          value: '0'
        }
      ]
      const options = {
        gasLimit: '100',
        isSponsored: true
      }

      beforeEach(() => {
        jest.clearAllMocks()
        relayPack = new GelatoRelayPack()
        safe.getNonce = jest.fn().mockResolvedValue(0)
        safe.getContractManager = jest.fn().mockReturnValue({ safeContract: {} })
        safe.createTransaction = jest.fn().mockResolvedValue(SAFE_TRANSACTION)
        mockedIsGasTokenCompatibleWithHandlePayment.mockResolvedValue(Promise.resolve(true))
      })

      it('should allow you to create a sponsored one', async () => {
        await relayPack.createRelayedTransaction({ safe, transactions, options })

        expect(safe.createTransaction).toHaveBeenCalledWith({
          safeTransactionData: transactions,
          onlyCalls: false,
          options: {
            nonce: 0
          }
        })
      })

      it('should allow to create a sync fee one', async () => {
        await relayPack.createRelayedTransaction({
          safe,
          transactions,
          options: { ...options, isSponsored: false }
        })

        expect(safe.createTransaction).toHaveBeenCalledWith({
          safeTransactionData: transactions,
          onlyCalls: false,
          options: {
            baseGas: FEE_ESTIMATION.toString(),
            safeTxGas: SAFETXGAS_ESTIMATION,
            gasPrice: '1',
            gasToken: ZERO_ADDRESS, // native token
            refundReceiver: GELATO_FEE_COLLECTOR,
            nonce: 0
          }
        })
      })

      it('should return the correct gasToken when being sent through the options', async () => {
        await relayPack.createRelayedTransaction({
          safe,
          transactions,
          options: { ...options, isSponsored: false, gasToken: GAS_TOKEN }
        })

        expect(safe.createTransaction).toHaveBeenCalledWith({
          safeTransactionData: transactions,
          onlyCalls: false,
          options: {
            baseGas: FEE_ESTIMATION.toString(),
            safeTxGas: SAFETXGAS_ESTIMATION,
            gasPrice: '1',
            gasToken: GAS_TOKEN,
            refundReceiver: GELATO_FEE_COLLECTOR,
            nonce: 0
          }
        })
      })

      it('should allow you to create relay transaction using a non standard ERC20 gas token to pay Gelato fees', async () => {
        // non standard ERC20 like USDC
        mockedIsGasTokenCompatibleWithHandlePayment.mockResolvedValue(Promise.resolve(false))

        const options = {
          gasToken: GAS_TOKEN,
          isSponsored: false,
          gasLimit: '5000' // manual gas limit
        }

        const transferToGelato = {
          to: GELATO_FEE_COLLECTOR,
          value: FEE_ESTIMATION.toString(),
          data: '0x'
        }

        mockCreateERC20TokenTransferTransaction.mockReturnValue(transferToGelato)

        await relayPack.createRelayedTransaction({ safe, transactions, options })

        expect(safe.createTransaction).toHaveBeenCalledWith({
          safeTransactionData: [...transactions, transferToGelato], // the transfer to Gelato is prensent
          onlyCalls: false,
          options: {
            gasToken: GAS_TOKEN, // non standard ERC20 gas token
            nonce: 0
          }
        })
      })
    })

    describe('When gas limit is automatically estimate', () => {
      let relayPack: GelatoRelayPack
      const safe: Safe = new Safe()

      const mockTransferTransacton: MetaTransactionData = {
        to: ADDRESS,
        data: '0x',
        value: '0'
      }

      const transactions: MetaTransactionData[] = [mockTransferTransacton]

      beforeEach(() => {
        jest.clearAllMocks()
        relayPack = new GelatoRelayPack()
        safe.getNonce = jest.fn().mockResolvedValue(0)
        safe.getContractManager = jest.fn().mockReturnValue({ safeContract: {} })
        safe.createTransaction = jest.fn().mockResolvedValue(SAFE_TRANSACTION)
        mockedIsGasTokenCompatibleWithHandlePayment.mockResolvedValue(Promise.resolve(true))
      })

      it('should allow you to create a sponsored one', async () => {
        const options = {
          isSponsored: true
        }

        await relayPack.createRelayedTransaction({ safe, transactions, options })

        expect(safe.createTransaction).toHaveBeenCalledWith({
          safeTransactionData: transactions,
          onlyCalls: false,
          options: {
            nonce: 0
          }
        })
      })

      describe('When a compatible gas token is used', () => {
        beforeEach(() => {
          jest.clearAllMocks()
          mockedIsGasTokenCompatibleWithHandlePayment.mockResolvedValue(Promise.resolve(true))
        })

        it('should allow you to create relay transaction using the native token to pay Gelato fees', async () => {
          await relayPack.createRelayedTransaction({ safe, transactions })

          expect(safe.createTransaction).toHaveBeenCalledWith({
            safeTransactionData: transactions,
            onlyCalls: false,
            options: {
              baseGas: FEE_ESTIMATION.toString(),
              gasPrice: '1',
              safeTxGas: SAFETXGAS_ESTIMATION,
              gasToken: ZERO_ADDRESS, // native token
              refundReceiver: GELATO_FEE_COLLECTOR,
              nonce: 0
            }
          })
        })

        it('should allow you to create relay transaction using a compatible ERC20 token to pay Gelato fees', async () => {
          const options = {
            gasToken: GAS_TOKEN
          }

          await relayPack.createRelayedTransaction({ safe, transactions, options })

          expect(safe.createTransaction).toHaveBeenCalledWith({
            safeTransactionData: transactions,
            onlyCalls: false,
            options: {
              baseGas: FEE_ESTIMATION.toString(),
              gasPrice: '1',
              safeTxGas: SAFETXGAS_ESTIMATION,
              gasToken: GAS_TOKEN, // ERC20 gas token
              refundReceiver: GELATO_FEE_COLLECTOR,
              nonce: 0
            }
          })
        })
      })

      describe('When a non compatible gas token is used', () => {
        beforeEach(() => {
          jest.clearAllMocks()
          mockedIsGasTokenCompatibleWithHandlePayment.mockResolvedValue(Promise.resolve(false))
        })

        it('should allow you to create relay transaction using a non standard ERC20 gas token to pay Gelato fees', async () => {
          const options = {
            gasToken: GAS_TOKEN
          }

          const transferToGelato = {
            to: GELATO_FEE_COLLECTOR,
            value: FEE_ESTIMATION.toString(),
            data: '0x'
          }

          mockCreateERC20TokenTransferTransaction.mockReturnValue(transferToGelato)

          await relayPack.createRelayedTransaction({ safe, transactions, options })

          expect(safe.createTransaction).toHaveBeenCalledWith({
            safeTransactionData: [...transactions, transferToGelato], // the transfer to Gelato is prensent
            onlyCalls: false,
            options: {
              gasToken: GAS_TOKEN, // non standard ERC20 gas token
              nonce: 0
            }
          })
        })
      })
    })
  })

  it('should allow to make a sync fee transaction', async () => {
    const response = await gelatoRelayPack.sendSyncTransaction(SAFE_ADDRESS, '0x', CHAIN_ID, {
      gasLimit: '100000'
    })

    expect(response).toBe(RELAY_RESPONSE)
    expect(mockCallWithSyncFee).toHaveBeenCalledWith(
      {
        chainId: CHAIN_ID,
        target: SAFE_ADDRESS,
        data: '0x',
        feeToken: GELATO_NATIVE_TOKEN_ADDRESS,
        isRelayContext: false
      },
      {
        gasLimit: '100000'
      }
    )
  })

  it('should expose a relayTransaction doing a sponsored or sync fee transaction depending on an optional parameter', async () => {
    const sponsoredResponse = await gelatoRelayPack.relayTransaction({
      target: SAFE_ADDRESS,
      encodedTransaction: '0x',
      chainId: CHAIN_ID,
      options: {
        gasLimit: '100000',
        isSponsored: true
      }
    })

    expect(sponsoredResponse).toBe(RELAY_RESPONSE)
    expect(mockSponsoredCall).toHaveBeenCalledWith(
      {
        chainId: CHAIN_ID,
        target: SAFE_ADDRESS,
        data: '0x'
      },
      API_KEY
    )

    const paidResponse = await gelatoRelayPack.relayTransaction({
      target: SAFE_ADDRESS,
      encodedTransaction: '0x',
      chainId: CHAIN_ID,
      options: {
        gasLimit: '100000',
        isSponsored: false
      }
    })

    expect(paidResponse).toBe(RELAY_RESPONSE)
    expect(mockCallWithSyncFee).toHaveBeenCalledWith(
      {
        chainId: CHAIN_ID,
        target: SAFE_ADDRESS,
        data: '0x',
        feeToken: GELATO_NATIVE_TOKEN_ADDRESS,
        isRelayContext: false
      },
      {
        gasLimit: '100000'
      }
    )
  })

  it('should allow to retrieve the fee collector address', () => {
    expect(gelatoRelayPack.getFeeCollector()).toBe(GELATO_FEE_COLLECTOR)
  })

  describe('executeRelayTransaction', () => {
    const safe: Safe = new Safe()

    const ENCODED_TRANSACTION_DATA = '0x...txData'
    const MULTISEND_ADDRESS = '0x...multiSendAddress'
    const SAFE_DEPLOYMENT_BATCH = {
      to: MULTISEND_ADDRESS,
      value: '0',
      data: '0x...deplymentBachData'
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
        const options = {
          isSponsored: true
        }

        const relayTransaction = {
          data: {
            nonce: 0,
            to: ADDRESS,
            value: '0',
            data: '0x'
          }
        }

        const gelatoResponse = await gelatoRelayPack.executeRelayTransaction(
          relayTransaction as SafeTransaction,
          safe,
          options
        )

        expect(gelatoResponse).toBe(RELAY_RESPONSE)
        expect(mockSponsoredCall).toHaveBeenCalledWith(
          {
            chainId: CHAIN_ID,
            target: SAFE_ADDRESS,
            data: ENCODED_TRANSACTION_DATA
          },
          API_KEY
        )
        // no counterfactual deployment present
        expect(safe.wrapSafeTransactionIntoDeploymentBatch).not.toHaveBeenCalled()
      })

      it('should execute a sync relay transaction', async () => {
        const relayTransaction = {
          data: {
            operation: OperationType.Call,
            safeTxGas: SAFETXGAS_ESTIMATION,
            baseGas: FEE_ESTIMATION.toString(),
            gasPrice: '1',
            nonce: 0,
            gasToken: GAS_TOKEN,
            refundReceiver: GELATO_FEE_COLLECTOR,
            to: ADDRESS,
            value: '0',
            data: '0x'
          }
        }

        const gelatoResponse = await gelatoRelayPack.executeRelayTransaction(
          relayTransaction as SafeTransaction,
          safe
        )

        expect(gelatoResponse).toBe(RELAY_RESPONSE)
        expect(mockCallWithSyncFee).toHaveBeenCalledWith(
          {
            chainId: CHAIN_ID,
            target: SAFE_ADDRESS,
            data: ENCODED_TRANSACTION_DATA,
            feeToken: GAS_TOKEN,
            isRelayContext: false
          },
          { gasLimit: undefined }
        )
        // no counterfactual deployment present
        expect(safe.wrapSafeTransactionIntoDeploymentBatch).not.toHaveBeenCalled()
      })
    })

    describe('when the Safe is not deployed (counterfactual deployment)', () => {
      it('should execute a sponsored relay transaction & counterfactual deployment', async () => {
        // Safe is not deployed
        safe.isSafeDeployed = jest.fn().mockResolvedValue(false)

        const options = {
          isSponsored: true
        }

        const relayTransaction = {
          data: {
            nonce: 0,
            to: ADDRESS,
            value: '0',
            data: '0x'
          }
        }

        const gelatoResponse = await gelatoRelayPack.executeRelayTransaction(
          relayTransaction as SafeTransaction,
          safe,
          options
        )

        expect(gelatoResponse).toBe(RELAY_RESPONSE)
        expect(mockSponsoredCall).toHaveBeenCalledWith(
          {
            chainId: CHAIN_ID,
            target: MULTISEND_ADDRESS, // multiSend contract as a target address because a counterfactual deployment is present
            data: SAFE_DEPLOYMENT_BATCH.data
          },
          API_KEY
        )
        // counterfactual deployment in present
        expect(safe.wrapSafeTransactionIntoDeploymentBatch).toHaveBeenCalled()
      })

      it('should execute a sync relay transaction & counterfactual deployment', async () => {
        // Safe is not deployed
        safe.isSafeDeployed = jest.fn().mockResolvedValue(false)

        const relayTransaction = {
          data: {
            operation: OperationType.Call,
            safeTxGas: SAFETXGAS_ESTIMATION,
            baseGas: FEE_ESTIMATION.toString(),
            gasPrice: '1',
            nonce: 0,
            gasToken: GAS_TOKEN,
            refundReceiver: GELATO_FEE_COLLECTOR,
            to: ADDRESS,
            value: '0',
            data: '0x'
          }
        }

        const gelatoResponse = await gelatoRelayPack.executeRelayTransaction(
          relayTransaction as SafeTransaction,
          safe
        )

        expect(gelatoResponse).toBe(RELAY_RESPONSE)
        expect(mockCallWithSyncFee).toHaveBeenCalledWith(
          {
            chainId: CHAIN_ID,
            target: MULTISEND_ADDRESS, // multiSend contract as a target address because a counterfactual deployment is present
            data: SAFE_DEPLOYMENT_BATCH.data,
            feeToken: GAS_TOKEN,
            isRelayContext: false
          },
          { gasLimit: undefined }
        )
        // counterfactual deployment in present
        expect(safe.wrapSafeTransactionIntoDeploymentBatch).toHaveBeenCalled()
      })
    })
  })
})
