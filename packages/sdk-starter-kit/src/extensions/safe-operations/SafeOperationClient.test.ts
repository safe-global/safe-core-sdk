import Safe, * as protocolKitModule from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { Safe4337Pack, SafeOperationV06 } from '@safe-global/relay-kit'

import { SafeOperationClient } from './SafeOperationClient'
import { MESSAGES, SafeClientTxStatus } from '../../constants'

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
const TRANSACTION_BATCH = [TRANSACTION]
const SAFE_ADDRESS = '0xSafeAddress'
const SAFE_OPERATION_HASH = '0xSafeOperationHash'
const USER_OPERATION_HASH = '0xUserOperationHash'
const PENDING_SAFE_OPERATIONS = [{ safeOperationHash: SAFE_OPERATION_HASH }]
const SAFE_OPERATION_RESPONSE = {
  confirmations: [
    {
      signature: 'OxSignature'
    },
    {
      signature: 'OxSignature'
    }
  ]
}
const SAFE_OPERATION = new SafeOperationV06(
  {
    sender: '0xSenderAddress',
    nonce: '0',
    initCode: '0xInitCode',
    callData: '0xCallData',
    callGasLimit: 0n,
    verificationGasLimit: 0n,
    preVerificationGas: 0n,
    maxFeePerGas: 0n,
    maxPriorityFeePerGas: 0n,
    paymasterAndData: '0xPaymasterAndData',
    signature: '0xSignature'
  },
  {
    chainId: 1n,
    entryPoint: '0xEntryPoint',
    moduleAddress: '0xModuleAddress'
  }
)

describe('SafeOperationClient', () => {
  let safeOperationClient: SafeOperationClient
  let protocolKit: Safe
  let apiKit: jest.Mocked<SafeApiKit>
  let safe4337Pack: Safe4337Pack

  beforeEach(() => {
    const bundlerClientMock = { send: jest.fn().mockResolvedValue('1') } as any

    protocolKit = new Safe()
    apiKit = new SafeApiKit({ chainId: 1n }) as jest.Mocked<SafeApiKit>
    safe4337Pack = new Safe4337Pack({
      protocolKit,
      bundlerClient: bundlerClientMock,
      bundlerUrl: 'http://bundler.url',
      chainId: 1n,
      paymasterOptions: undefined,
      entryPointAddress: '0xEntryPoint',
      safe4337ModuleAddress: '0xModuleAddress'
    }) as jest.Mocked<Safe4337Pack>

    safe4337Pack.protocolKit = protocolKit

    safeOperationClient = new SafeOperationClient(safe4337Pack, apiKit)

    apiKit.confirmSafeOperation = jest.fn().mockResolvedValue(true)
    apiKit.getSafeOperation = jest.fn().mockResolvedValue(SAFE_OPERATION_RESPONSE)

    protocolKit.getAddress = jest.fn().mockResolvedValue(SAFE_ADDRESS)
    protocolKit.signHash = jest
      .fn()
      .mockResolvedValue(new protocolKitModule.EthSafeSignature('0xSigner', '0xSignature'))

    safe4337Pack.createTransaction = jest.fn().mockResolvedValue(SAFE_OPERATION)
    safe4337Pack.signSafeOperation = jest.fn().mockResolvedValue(SAFE_OPERATION)
    safe4337Pack.executeTransaction = jest.fn().mockResolvedValue(USER_OPERATION_HASH)
    safe4337Pack.getUserOperationReceipt = jest
      .fn()
      .mockResolvedValue({ hash: USER_OPERATION_HASH })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should allow to instantiate a SafeOperationClient', () => {
    expect(safeOperationClient).toBeInstanceOf(SafeOperationClient)
    expect(safeOperationClient.safe4337Pack).toBe(safe4337Pack)
    expect(safeOperationClient.apiKit).toBe(apiKit)
  })

  describe('sendSafeOperation', () => {
    it('should save the Safe operation using the Transaction service when threshold is > 1', async () => {
      protocolKit.getThreshold = jest.fn().mockResolvedValue(2)
      jest.spyOn(SAFE_OPERATION, 'getHash').mockReturnValue(SAFE_OPERATION_HASH)

      const safeOperationResult = await safeOperationClient.sendSafeOperation({
        transactions: TRANSACTION_BATCH
      })

      expect(safe4337Pack.createTransaction).toHaveBeenCalledWith({
        transactions: TRANSACTION_BATCH,
        options: {}
      })
      expect(safe4337Pack.signSafeOperation).toHaveBeenCalledWith(SAFE_OPERATION)
      expect(apiKit.addSafeOperation).toHaveBeenCalledWith(SAFE_OPERATION)

      expect(safeOperationResult).toEqual({
        safeAddress: SAFE_ADDRESS,
        description: MESSAGES[SafeClientTxStatus.SAFE_OPERATION_PENDING_SIGNATURES],
        status: SafeClientTxStatus.SAFE_OPERATION_PENDING_SIGNATURES,
        safeOperations: { safeOperationHash: SAFE_OPERATION_HASH }
      })
    })

    it('should send the Safe operation to the bundler when threshold === 1', async () => {
      protocolKit.getThreshold = jest.fn().mockResolvedValue(1)
      jest.spyOn(SAFE_OPERATION, 'getHash').mockReturnValue(SAFE_OPERATION_HASH)

      const safeOperationResult = await safeOperationClient.sendSafeOperation({
        transactions: TRANSACTION_BATCH
      })

      expect(safe4337Pack.executeTransaction).toHaveBeenCalledWith({ executable: SAFE_OPERATION })

      expect(safeOperationResult).toEqual({
        safeAddress: SAFE_ADDRESS,
        description: MESSAGES[SafeClientTxStatus.SAFE_OPERATION_EXECUTED],
        status: SafeClientTxStatus.SAFE_OPERATION_EXECUTED,
        safeOperations: {
          safeOperationHash: SAFE_OPERATION_HASH,
          userOperationHash: USER_OPERATION_HASH
        }
      })
    })
  })

  describe('confirmSafeOperation', () => {
    it('should send the User operation to the bundler without confirmation when threshold is already reached', async () => {
      protocolKit.getThreshold = jest.fn().mockResolvedValue(2)

      const safeOperationResult = await safeOperationClient.confirmSafeOperation({
        safeOperationHash: SAFE_OPERATION_HASH
      })

      expect(apiKit.confirmSafeOperation).not.toHaveBeenCalledWith()

      expect(safe4337Pack.executeTransaction).toHaveBeenCalledWith({
        executable: SAFE_OPERATION_RESPONSE
      })

      expect(safeOperationResult).toEqual({
        safeAddress: SAFE_ADDRESS,
        description: MESSAGES[SafeClientTxStatus.SAFE_OPERATION_EXECUTED],
        status: SafeClientTxStatus.SAFE_OPERATION_EXECUTED,
        safeOperations: {
          safeOperationHash: SAFE_OPERATION_HASH,
          userOperationHash: USER_OPERATION_HASH
        }
      })
    })

    it('should return more signatures are required when threshold is not reached after confirmation', async () => {
      protocolKit.getThreshold = jest.fn().mockResolvedValue(3)

      const safeOperationResult = await safeOperationClient.confirmSafeOperation({
        safeOperationHash: SAFE_OPERATION_HASH
      })

      expect(apiKit.confirmSafeOperation).toHaveBeenCalledWith(SAFE_OPERATION_HASH, undefined)

      expect(safeOperationResult).toEqual({
        safeAddress: SAFE_ADDRESS,
        description: MESSAGES[SafeClientTxStatus.SAFE_OPERATION_PENDING_SIGNATURES],
        status: SafeClientTxStatus.SAFE_OPERATION_PENDING_SIGNATURES,
        safeOperations: {
          safeOperationHash: SAFE_OPERATION_HASH
        }
      })
    })

    it('should send the User operation to the bundler after reaching the threshold with the confirmation', async () => {
      const CONFIRMED_SAFE_OPERATION_RESPONSE = {
        ...SAFE_OPERATION_RESPONSE,
        confirmations: [
          ...SAFE_OPERATION_RESPONSE.confirmations,
          {
            signature: 'OxSignature'
          }
        ]
      }
      protocolKit.getThreshold = jest.fn().mockResolvedValue(3)
      apiKit.getSafeOperation = jest
        .fn()
        .mockResolvedValueOnce(SAFE_OPERATION_RESPONSE)
        .mockResolvedValueOnce(CONFIRMED_SAFE_OPERATION_RESPONSE)

      const safeOperationResult = await safeOperationClient.confirmSafeOperation({
        safeOperationHash: SAFE_OPERATION_HASH
      })

      expect(apiKit.confirmSafeOperation).toHaveBeenCalledWith(SAFE_OPERATION_HASH, undefined)
      expect(safe4337Pack.executeTransaction).toHaveBeenCalledWith({
        executable: CONFIRMED_SAFE_OPERATION_RESPONSE
      })

      expect(safeOperationResult).toEqual({
        safeAddress: SAFE_ADDRESS,
        description: MESSAGES[SafeClientTxStatus.SAFE_OPERATION_EXECUTED],
        status: SafeClientTxStatus.SAFE_OPERATION_EXECUTED,
        safeOperations: {
          safeOperationHash: SAFE_OPERATION_HASH,
          userOperationHash: USER_OPERATION_HASH
        }
      })
    })
  })

  describe('getPendingSafeOperations', () => {
    it('should return the pending Safe operations for the Safe address', async () => {
      apiKit.getPendingSafeOperations = jest.fn().mockResolvedValue(PENDING_SAFE_OPERATIONS)

      const result = await safeOperationClient.getPendingSafeOperations()

      expect(protocolKit.getAddress).toHaveBeenCalled()
      expect(apiKit.getPendingSafeOperations).toHaveBeenCalledWith(SAFE_ADDRESS, undefined)
      expect(result).toBe(PENDING_SAFE_OPERATIONS)
    })
  })
})
