import { SafeOnRampOpenOptions } from './types'

import { SafeOnRampKit } from './SafeOnRampKit'
import * as stripeAdapter from './packs/stripe/StripeAdapter'

const openOptions: SafeOnRampOpenOptions<stripeAdapter.StripeAdapter> = {
  element: '#root',
  defaultOptions: {
    transaction_details: {
      wallet_address: '0x',
      supported_destination_networks: ['ethereum']
    }
  }
}

const config = {
  stripePublicKey: 'stripe-public-key',
  onRampBackendUrl: 'onramp-backend-url'
}

jest.mock('./packs/stripe/StripeAdapter')

describe('SafeOnRampKit', () => {
  let adapter: stripeAdapter.StripeAdapter

  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()

    adapter = new stripeAdapter.StripeAdapter(config)
  })

  it('should create a SafeOnRampKit instance when using the init() method', async () => {
    const safeOnRampKit = await SafeOnRampKit.init(adapter)

    expect(safeOnRampKit).toBeInstanceOf(SafeOnRampKit)
  })

  it('should create a XXXAdapter instance using the provider config and call the init() method in the instance', async () => {
    await SafeOnRampKit.init(adapter)

    expect(stripeAdapter.StripeAdapter).toHaveBeenCalledWith(expect.objectContaining(config))
    expect(stripeAdapter.StripeAdapter.prototype.init).toHaveBeenCalledWith()
  })

  it('should call the open method in the XXXAdapter with the corresponding options', async () => {
    const safeOnRampKit = await SafeOnRampKit.init(adapter)

    safeOnRampKit.open(openOptions)

    expect(stripeAdapter.StripeAdapter.prototype.open).toHaveBeenCalledWith(
      expect.objectContaining(openOptions)
    )
  })

  it('should call the close method in the XXXAdapter', async () => {
    const safeOnRampKit = await SafeOnRampKit.init(adapter)

    safeOnRampKit.close()

    expect(stripeAdapter.StripeAdapter.prototype.close).toHaveBeenCalled()
  })
})
