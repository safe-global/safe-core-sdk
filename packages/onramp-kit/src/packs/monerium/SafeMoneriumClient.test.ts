import { hashMessage } from '@ethersproject/hash'
import { Currency, PaymentStandard } from '@monerium/sdk'
import Safe, * as protocolKit from '@safe-global/protocol-kit'
import { OperationType } from '@safe-global/safe-core-sdk-types'
import SafeApiKit from '@safe-global/api-kit'

import { SafeMoneriumClient } from './SafeMoneriumClient'
import { MAGIC_VALUE } from './signatures'

const newOrder = {
  amount: '100',
  currency: Currency.eur,
  counterpart: {
    identifier: {
      standard: 'iban' as PaymentStandard.iban,
      iban: 'iban'
    },
    details: {
      firstName: 'firstName',
      lastName: 'lastName'
    }
  },
  memo: 'memo'
}

jest.mock('@monerium/sdk')
jest.mock('@safe-global/protocol-kit')
jest.mock('@safe-global/api-kit')

describe('SafeMoneriumClient', () => {
  const safeSdk = new Safe()
  let safeMoneriumClient: SafeMoneriumClient

  beforeEach(() => {
    jest.clearAllMocks()
    safeSdk.getChainId = jest.fn().mockResolvedValue(5)
    safeSdk.getEthAdapter = jest.fn().mockReturnValue({
      call: jest.fn().mockImplementation(async () => MAGIC_VALUE),
      getSignerAddress: jest.fn().mockResolvedValue('0xSignerAddress')
    })
    safeMoneriumClient = new SafeMoneriumClient('sandbox', safeSdk)
  })

  it('should create a SafeMoneriumClient instance', () => {
    expect(safeMoneriumClient).toBeInstanceOf(SafeMoneriumClient)
  })

  it('should allow to get the Safe address', async () => {
    safeSdk.getAddress = jest.fn(() => Promise.resolve('0xSafeAddress'))
    expect(await safeMoneriumClient.getSafeAddress()).toBe('0xSafeAddress')
  })

  it('should allow to send tokens from then Safe to any IBAN', async () => {
    safeSdk.getAddress = jest.fn(() => Promise.resolve('0xSafeAddress'))
    const placeOrderSpy = jest.spyOn(safeMoneriumClient, 'placeOrder')
    //@ts-expect-error - Not all values are mocked
    const signMessageSpy = jest.spyOn(safeMoneriumClient, 'signMessage').mockResolvedValueOnce({
      safe: '0xSafeAddress',
      to: '0xAddress',
      value: '0',
      operation: 1
    })

    await safeMoneriumClient.send({ ...newOrder })

    expect(placeOrderSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        ...newOrder,
        address: '0xSafeAddress',
        chain: 'ethereum',
        kind: 'redeem',
        message: expect.stringContaining('Send EUR 100 to iban at'),
        network: 'goerli',
        signature: '0x',
        supportingDocumentId: ''
      })
    )

    expect(signMessageSpy).toHaveBeenCalledWith(
      '0xSafeAddress',
      expect.stringContaining('Send EUR 100 to iban at')
    )
  })

  it('should allow to check if a message is signed in the smart contract', async () => {
    const isMessageSigned = await safeMoneriumClient.isMessageSigned(
      '0xSafeAddress',
      'message to sign'
    )

    expect(isMessageSigned).toBe(true)
  })

  it('should allow to check if a message is pending in the safe transaction queue', async () => {
    jest.spyOn(SafeApiKit.prototype, 'getPendingTransactions').mockResolvedValueOnce({
      count: 0,
      results: []
    })

    const isSignMessagePending = await safeMoneriumClient.isSignMessagePending(
      '0xSafeAddress',
      'message to sign'
    )

    expect(isSignMessagePending).toBe(false)

    jest.spyOn(SafeApiKit.prototype, 'getPendingTransactions').mockResolvedValueOnce({
      count: 0,
      results: [
        {
          // @ts-expect-error - dataDecoded should have the method property
          dataDecoded: {
            method: 'signMessage',
            parameters: [{ value: hashMessage('message to sign') }]
          }
        }
      ]
    })

    const isSignMessagePending2 = await safeMoneriumClient.isSignMessagePending(
      '0xSafeAddress',
      'message to sign'
    )

    expect(isSignMessagePending2).toBe(true)
  })

  it('should allow to sign a message', async () => {
    const txData = {
      operation: OperationType.DelegateCall,
      baseGas: 0,
      safeTxGas: 1000000,
      gasPrice: 0,
      gasToken: '0x000',
      refundReceiver: '0x00000000',
      nonce: 0
    }

    jest.spyOn(protocolKit, 'getSignMessageLibContract').mockResolvedValueOnce({
      encode: jest.fn(),
      getAddress: jest.fn(),
      getMessageHash: jest.fn(),
      signMessage: jest.fn(),
      estimateGas: jest.fn()
    })

    safeSdk.createTransaction = jest.fn().mockResolvedValueOnce({
      data: txData
    })

    safeSdk.getTransactionHash = jest.fn().mockResolvedValueOnce('0xTransactionHash')
    safeSdk.signTransactionHash = jest.fn().mockResolvedValueOnce('0xTransactionSignature')

    jest.spyOn(SafeApiKit.prototype, 'getTransaction').mockResolvedValueOnce({
      confirmationsRequired: 1,
      //@ts-expect-error - Only required properties are mocked
      confirmations: [{ to: '0xSignerAddress' }]
    })

    const proposeTransactionSpy = jest.spyOn(SafeApiKit.prototype, 'proposeTransaction')
    safeSdk.executeTransaction = jest.fn()
    await safeMoneriumClient.signMessage('0xSafeAddress', 'message to sign')

    expect(proposeTransactionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        safeAddress: '0xSafeAddress',
        safeTransactionData: txData,
        safeTxHash: '0xTransactionHash',
        senderAddress: '0xSignerAddress',
        senderSignature: undefined
      })
    )
  })

  it('should map the protocol kit chainId to the Monerium Chain types', async () => {
    safeSdk.getChainId = jest.fn().mockResolvedValueOnce(1)
    expect(await safeMoneriumClient.getChain()).toBe('ethereum')
    safeSdk.getChainId = jest.fn().mockResolvedValueOnce(5)
    expect(await safeMoneriumClient.getChain()).toBe('ethereum')
    safeSdk.getChainId = jest.fn().mockResolvedValueOnce(100)
    expect(await safeMoneriumClient.getChain()).toBe('gnosis')
    safeSdk.getChainId = jest.fn().mockResolvedValueOnce(10200)
    expect(await safeMoneriumClient.getChain()).toBe('gnosis')
    safeSdk.getChainId = jest.fn().mockResolvedValueOnce(137)
    expect(await safeMoneriumClient.getChain()).toBe('polygon')
    safeSdk.getChainId = jest.fn().mockResolvedValueOnce(80001)
    expect(await safeMoneriumClient.getChain()).toBe('polygon')
    safeSdk.getChainId = jest.fn().mockResolvedValueOnce(300)
    expect(safeMoneriumClient.getChain()).rejects.toThrowError('Chain not supported: 300')
  })

  it('should map the protocol kit chainId to the Monerium Network types', async () => {
    safeSdk.getChainId = jest.fn().mockResolvedValueOnce(1)
    expect(await safeMoneriumClient.getNetwork()).toBe('mainnet')
    safeSdk.getChainId = jest.fn().mockResolvedValueOnce(5)
    expect(await safeMoneriumClient.getNetwork()).toBe('goerli')
    safeSdk.getChainId = jest.fn().mockResolvedValueOnce(100)
    expect(await safeMoneriumClient.getNetwork()).toBe('mainnet')
    safeSdk.getChainId = jest.fn().mockResolvedValueOnce(10200)
    expect(await safeMoneriumClient.getNetwork()).toBe('chiado')
    safeSdk.getChainId = jest.fn().mockResolvedValueOnce(137)
    expect(await safeMoneriumClient.getNetwork()).toBe('mainnet')
    safeSdk.getChainId = jest.fn().mockResolvedValueOnce(80001)
    expect(await safeMoneriumClient.getNetwork()).toBe('mumbai')
    safeSdk.getChainId = jest.fn().mockResolvedValueOnce(300)
    expect(safeMoneriumClient.getNetwork()).rejects.toThrowError('Network not supported: 300')
  })

  it('should map the protocol kit chainId to the Safe transaction service urls', async () => {
    safeSdk.getChainId = jest.fn().mockResolvedValueOnce(1)
    expect(await safeMoneriumClient.getTransactionServiceUrl()).toBe(
      'https://safe-transaction-mainnet.safe.global'
    )
    safeSdk.getChainId = jest.fn().mockResolvedValueOnce(5)
    expect(await safeMoneriumClient.getTransactionServiceUrl()).toBe(
      'https://safe-transaction-goerli.safe.global'
    )
    safeSdk.getChainId = jest.fn().mockResolvedValueOnce(100)
    expect(await safeMoneriumClient.getTransactionServiceUrl()).toBe(
      'https://safe-transaction-gnosis.safe.global'
    )
    safeSdk.getChainId = jest.fn().mockResolvedValueOnce(137)
    expect(await safeMoneriumClient.getTransactionServiceUrl()).toBe(
      'https://safe-transaction-polygon.safe.global'
    )
    safeSdk.getChainId = jest.fn().mockResolvedValueOnce(300)
    expect(safeMoneriumClient.getTransactionServiceUrl()).rejects.toThrowError(
      'Chain not supported: 300'
    )
  })
})
