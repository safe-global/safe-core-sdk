import Safe, * as protocolKitModule from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'

import * as utils from '../../utils'
import { SafeMessageClient } from './SafeMessageClient'
import { MESSAGES, SafeClientTxStatus } from '../../constants'

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

const MESSAGE = 'I am the owner of this Safe'
const MESSAGE_RESPONSE = { message: MESSAGE, confirmations: [{ signature: '0xSignature' }] }
const DEPLOYMENT_TRANSACTION = { to: '0xMultisig', value: '0', data: '0x' }
const SAFE_ADDRESS = '0xSafeAddress'
const SAFE_MESSAGE = new protocolKitModule.EthSafeMessage(MESSAGE)
const SAFE_PROVIDER = {
  provider: 'http://ethereum.provider',
  signer: '0xSignerAddress'
}

describe('SafeClient', () => {
  let safeMessageClient: SafeMessageClient
  let protocolKit: Safe
  let apiKit: jest.Mocked<SafeApiKit>

  beforeEach(() => {
    protocolKit = new Safe()
    apiKit = new SafeApiKit({ chainId: 1n }) as jest.Mocked<SafeApiKit>
    safeMessageClient = new SafeMessageClient(protocolKit, apiKit)

    apiKit.getMessage = jest.fn().mockResolvedValue(MESSAGE_RESPONSE)

    protocolKit.createMessage = jest.fn().mockReturnValue(SAFE_MESSAGE)
    protocolKit.signMessage = jest.fn().mockResolvedValue(SAFE_MESSAGE)
    protocolKit.getAddress = jest.fn().mockResolvedValue(SAFE_ADDRESS)
    protocolKit.connect = jest.fn().mockResolvedValue(protocolKit)
    protocolKit.getContractVersion = jest.fn().mockReturnValue('1.1.1')
    protocolKit.getChainId = jest.fn().mockResolvedValue(1n)
    protocolKit.getSafeMessageHash = jest.fn().mockResolvedValue('0xSafeMessageHash')
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
    expect(safeMessageClient).toBeInstanceOf(SafeMessageClient)
    expect(safeMessageClient.protocolKit).toBe(protocolKit)
    expect(safeMessageClient.apiKit).toBe(apiKit)
  })

  describe('sendMessage', () => {
    it('should add a confirmed message if the Safe exists and the threshold === 1', async () => {
      protocolKit.isSafeDeployed = jest.fn().mockResolvedValue(true)
      protocolKit.getThreshold = jest.fn().mockResolvedValue(1)

      const result = await safeMessageClient.sendMessage({ message: MESSAGE })

      expect(protocolKit.createMessage).toHaveBeenCalledWith(MESSAGE)
      expect(protocolKit.signMessage).toHaveBeenCalledWith(SAFE_MESSAGE)
      expect(apiKit.addMessage).toHaveBeenCalledWith(SAFE_ADDRESS, {
        message: SAFE_MESSAGE.data,
        signature: SAFE_MESSAGE.encodedSignatures()
      })

      expect(result).toMatchObject({
        description: MESSAGES[SafeClientTxStatus.MESSAGE_CONFIRMED],
        safeAddress: SAFE_ADDRESS,
        status: SafeClientTxStatus.MESSAGE_CONFIRMED,
        messages: {
          messageHash: '0xSafeMessageHash'
        }
      })
    })

    it('should add a pending confirmation message if the Safe exists and the threshold > 1', async () => {
      protocolKit.isSafeDeployed = jest.fn().mockResolvedValue(true)
      protocolKit.getThreshold = jest.fn().mockResolvedValue(2)

      const result = await safeMessageClient.sendMessage({ message: MESSAGE })

      expect(protocolKit.createMessage).toHaveBeenCalledWith(MESSAGE)
      expect(protocolKit.signMessage).toHaveBeenCalledWith(SAFE_MESSAGE)
      expect(apiKit.addMessage).toHaveBeenCalledWith(SAFE_ADDRESS, {
        message: SAFE_MESSAGE.data,
        signature: SAFE_MESSAGE.encodedSignatures()
      })

      expect(result).toMatchObject({
        description: MESSAGES[SafeClientTxStatus.MESSAGE_PENDING_SIGNATURES],
        safeAddress: SAFE_ADDRESS,
        status: SafeClientTxStatus.MESSAGE_PENDING_SIGNATURES,
        messages: {
          messageHash: '0xSafeMessageHash'
        }
      })
    })

    it('should deploy and add the message if Safe account does not exist and has threshold > 1', async () => {
      protocolKit.isSafeDeployed = jest.fn().mockResolvedValue(false)
      protocolKit.getThreshold = jest.fn().mockResolvedValue(1)

      const result = await safeMessageClient.sendMessage({ message: MESSAGE })

      expect(protocolKit.createSafeDeploymentTransaction).toHaveBeenCalledWith()
      expect(utils.sendTransaction).toHaveBeenCalledWith({
        transaction: DEPLOYMENT_TRANSACTION,
        protocolKit
      })
      expect(protocolKit.connect).toHaveBeenCalled()

      expect(protocolKit.createMessage).toHaveBeenCalledWith(MESSAGE)
      expect(protocolKit.signMessage).toHaveBeenCalledWith(SAFE_MESSAGE)
      expect(apiKit.addMessage).toHaveBeenCalledWith(SAFE_ADDRESS, {
        message: SAFE_MESSAGE.data,
        signature: SAFE_MESSAGE.encodedSignatures()
      })

      expect(result).toMatchObject({
        description: MESSAGES[SafeClientTxStatus.DEPLOYED_AND_MESSAGE_CONFIRMED],
        safeAddress: SAFE_ADDRESS,
        status: SafeClientTxStatus.DEPLOYED_AND_MESSAGE_CONFIRMED,
        messages: {
          messageHash: '0xSafeMessageHash'
        },
        safeAccountDeployment: {
          ethereumTxHash: '0xSafeDeploymentEthereumHash'
        }
      })
    })
  })

  describe('confirmMessage', () => {
    it('should confirm the message', async () => {
      protocolKit.isSafeDeployed = jest.fn().mockResolvedValue(false)
      protocolKit.getThreshold = jest.fn().mockResolvedValue(1)

      const result = await safeMessageClient.confirmMessage({ messageHash: '0xSafeMessageHash' })

      expect(protocolKit.createMessage).toHaveBeenCalledWith(MESSAGE_RESPONSE.message)
      expect(protocolKit.signMessage).toHaveBeenCalledWith(SAFE_MESSAGE)
      expect(apiKit.addMessageSignature).toHaveBeenCalledWith('0xSafeMessageHash', undefined)
      expect(result).toMatchObject({
        description: MESSAGES[SafeClientTxStatus.MESSAGE_CONFIRMED],
        safeAddress: SAFE_ADDRESS,
        status: SafeClientTxStatus.MESSAGE_CONFIRMED,
        messages: {
          messageHash: '0xSafeMessageHash'
        }
      })
    })
  })

  describe('getPendingMessages', () => {
    it('should return the pending messages for the Safe address', async () => {
      const PENDING_MESSAGES = [{ messageHash: 'messageHash' }]

      apiKit.getMessages = jest.fn().mockResolvedValue(PENDING_MESSAGES)

      const result = await safeMessageClient.getPendingMessages()

      expect(apiKit.getMessages).toHaveBeenCalledWith(SAFE_ADDRESS, undefined)
      expect(result).toBe(PENDING_MESSAGES)
    })
  })
})
