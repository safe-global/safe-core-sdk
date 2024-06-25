import Safe from '@safe-global/protocol-kit'
import { TransactionBase, TransactionOptions } from '@safe-global/safe-core-sdk-types'

import { SafeClient } from './SafeClient'
import { sendTransaction, sendAndDeployTransaction } from './utils'
import { SafeClientTransactionResult } from './types'

jest.mock('./utils', () => ({
  sendTransaction: jest.fn(),
  sendAndDeployTransaction: jest.fn()
}))

jest.mock('@safe-global/protocol-kit')

const TRANSACTION = { to: '0xAddress', value: '0', data: '0x' }
const TRANSACTION_RESPONSE = { chain: { hash: '0xTxHash' } }

describe('SafeClient', () => {
  let protocolKit: Safe
  let safeClient: SafeClient

  beforeEach(async () => {
    protocolKit = new Safe()
    safeClient = new SafeClient(protocolKit)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize SafeClient correctly', () => {
    expect(safeClient).toHaveProperty('protocolKit', protocolKit)
  })

  it('should send transactions if Safe is deployed', async () => {
    const transactions: TransactionBase[] = [TRANSACTION]
    const options: TransactionOptions = {}
    ;(protocolKit.isSafeDeployed as jest.Mock).mockResolvedValue(true)
    ;(sendTransaction as jest.Mock).mockResolvedValue(TRANSACTION_RESPONSE)

    const result: SafeClientTransactionResult = await safeClient.send(transactions, options)

    expect(protocolKit.isSafeDeployed).toHaveBeenCalled()
    expect(sendTransaction).toHaveBeenCalledWith(transactions, options, safeClient)
    expect(result).toEqual(TRANSACTION_RESPONSE)
  })

  it('should deploy and send transactions if Safe is not deployed and threshold is 1', async () => {
    const transactions: TransactionBase[] = [TRANSACTION]
    const options: TransactionOptions = {}
    ;(protocolKit.isSafeDeployed as jest.Mock).mockResolvedValue(false)
    ;(protocolKit.getThreshold as jest.Mock).mockResolvedValue(1)
    ;(sendAndDeployTransaction as jest.Mock).mockResolvedValue(TRANSACTION_RESPONSE)

    const result: SafeClientTransactionResult = await safeClient.send(transactions, options)

    expect(protocolKit.isSafeDeployed).toHaveBeenCalled()
    expect(protocolKit.getThreshold).toHaveBeenCalled()
    expect(sendAndDeployTransaction).toHaveBeenCalledWith(transactions, options, safeClient)
    expect(result).toEqual(TRANSACTION_RESPONSE)
  })

  it('should throw an error if Safe is not deployed and threshold is greater than 1', async () => {
    const transactions: TransactionBase[] = []
    const options: TransactionOptions = {}
    ;(protocolKit.isSafeDeployed as jest.Mock).mockResolvedValue(false)
    ;(protocolKit.getThreshold as jest.Mock).mockResolvedValue(2)

    await expect(safeClient.send(transactions, options)).rejects.toThrow(
      'Deployment of Safes with threshold more than one is currently not supported'
    )

    expect(protocolKit.isSafeDeployed).toHaveBeenCalled()
    expect(protocolKit.getThreshold).toHaveBeenCalled()
    expect(sendAndDeployTransaction).not.toHaveBeenCalled()
    expect(sendTransaction).not.toHaveBeenCalled()
  })

  it('should extend the client with additional methods', () => {
    const extendedClient = safeClient.extend(() => ({
      newMethod: () => 'new method'
    }))

    expect(extendedClient).toHaveProperty('newMethod')
    expect((extendedClient as SafeClient & { newMethod: () => string }).newMethod()).toBe(
      'new method'
    )
  })
})
