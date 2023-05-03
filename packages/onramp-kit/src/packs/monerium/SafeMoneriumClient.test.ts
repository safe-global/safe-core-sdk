import Safe from '@safe-global/protocol-kit'
import { SafeMoneriumClient } from './SafeMoneriumClient'
import { Currency, PaymentStandard } from '@monerium/sdk'

jest.mock('@monerium/sdk')
jest.mock('@safe-global/protocol-kit')

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

describe('SafeMoneriumClient', () => {
  const safeSdk = new Safe()
  let safeMoneriumClient: SafeMoneriumClient

  beforeEach(() => {
    jest.clearAllMocks()
    safeSdk.getChainId = jest.fn().mockResolvedValue(5)
    safeMoneriumClient = new SafeMoneriumClient('sandbox', safeSdk)
  })

  it('should create a SafeMoneriumClient instance', () => {
    expect(safeMoneriumClient).toBeInstanceOf(SafeMoneriumClient)
  })

  it('should get the Safe address', async () => {
    safeSdk.getAddress = jest.fn(() => Promise.resolve('0xSafeAddress'))
    expect(await safeMoneriumClient.getSafeAddress()).toBe('0xSafeAddress')
  })

  it('should allow to send tokens', async () => {
    const placeOrderSpy = jest.spyOn(safeMoneriumClient, 'placeOrder')

    const signMessageSpy = jest.spyOn(safeMoneriumClient, 'signMessage').mockResolvedValueOnce()

    await safeMoneriumClient.send({ ...newOrder, safeAddress: '0xSafeAddress' })

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
})
