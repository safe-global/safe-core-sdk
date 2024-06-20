import Safe from '@safe-global/protocol-kit'
import { TransactionBase, TransactionOptions } from '@safe-global/safe-core-sdk-types'

import { SafeAccountClient } from './SafeAccountClient'
import { sendTransaction, sendAndDeployTransaction } from './lib'
import { SafeClient, SafeClientTransactionResult } from './types'

jest.mock('./lib', () => ({
  sendTransaction: jest.fn(),
  sendAndDeployTransaction: jest.fn()
}))

jest.mock('@safe-global/protocol-kit')

const TRANSACTION = { to: '0xAddress', value: '0', data: '0x' }
const TRANSACTION_RESPONSE = { chain: { hash: '0xTxHash' } }

describe('SafeAccountClient', () => {
  let protocolKit: Safe
  let safeAccountClient: SafeAccountClient

  beforeEach(async () => {
    protocolKit = new Safe()
    safeAccountClient = new SafeAccountClient(protocolKit)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize SafeAccountClient correctly', () => {
    expect(safeAccountClient).toHaveProperty('protocolKit', protocolKit)
  })

  it('should send transactions if Safe is deployed', async () => {
    const transactions: TransactionBase[] = [TRANSACTION]
    const options: TransactionOptions = {}
    ;(protocolKit.isSafeDeployed as jest.Mock).mockResolvedValue(true)
    ;(sendTransaction as jest.Mock).mockResolvedValue(TRANSACTION_RESPONSE)

    const result: SafeClientTransactionResult = await safeAccountClient.send(transactions, options)

    expect(protocolKit.isSafeDeployed).toHaveBeenCalled()
    expect(sendTransaction).toHaveBeenCalledWith(transactions, options, safeAccountClient)
    expect(result).toEqual(TRANSACTION_RESPONSE)
  })

  it('should deploy and send transactions if Safe is not deployed and threshold is 1', async () => {
    const transactions: TransactionBase[] = [TRANSACTION]
    const options: TransactionOptions = {}
    ;(protocolKit.isSafeDeployed as jest.Mock).mockResolvedValue(false)
    ;(protocolKit.getThreshold as jest.Mock).mockResolvedValue(1)
    ;(sendAndDeployTransaction as jest.Mock).mockResolvedValue(TRANSACTION_RESPONSE)

    const result: SafeClientTransactionResult = await safeAccountClient.send(transactions, options)

    expect(protocolKit.isSafeDeployed).toHaveBeenCalled()
    expect(protocolKit.getThreshold).toHaveBeenCalled()
    expect(sendAndDeployTransaction).toHaveBeenCalledWith(transactions, options, safeAccountClient)
    expect(result).toEqual({ chain: { hash: '0xTxHash' } })
  })

  it('should throw an error if Safe is not deployed and threshold is greater than 1', async () => {
    const transactions: TransactionBase[] = []
    const options: TransactionOptions = {}
    ;(protocolKit.isSafeDeployed as jest.Mock).mockResolvedValue(false)
    ;(protocolKit.getThreshold as jest.Mock).mockResolvedValue(2)

    await expect(safeAccountClient.send(transactions, options)).rejects.toThrowError(
      'Deployment of Safes with threshold more than one is currently not supported'
    )

    expect(protocolKit.isSafeDeployed).toHaveBeenCalled()
    expect(protocolKit.getThreshold).toHaveBeenCalled()
    expect(sendAndDeployTransaction).not.toHaveBeenCalled()
    expect(sendTransaction).not.toHaveBeenCalled()
  })

  it('should extend the client with additional methods', () => {
    const extendedClient = safeAccountClient.extend(() => ({
      newMethod: () => 'new method'
    }))

    expect(extendedClient).toHaveProperty('newMethod')
    expect((extendedClient as SafeClient & { newMethod: () => string }).newMethod()).toBe(
      'new method'
    )
  })
})
