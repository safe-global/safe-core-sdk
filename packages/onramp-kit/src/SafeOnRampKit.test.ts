import { SafeOnRampOpenOptions } from './types'

import { SafeOnRampKit } from './SafeOnRampKit'
import * as stripePack from './packs/stripe/StripePack'

const openOptions: SafeOnRampOpenOptions<stripePack.StripePack> = {
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

jest.mock('./packs/stripe/StripePack')

describe('SafeOnRampKit', () => {
  let pack: stripePack.StripePack

  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()

    pack = new stripePack.StripePack(config)
  })

  it('should create a SafeOnRampKit instance when using the init() method', async () => {
    const safeOnRampKit = await SafeOnRampKit.init(pack)

    expect(safeOnRampKit).toBeInstanceOf(SafeOnRampKit)
  })

  it('should create a XXXPack instance using the provider config and call the init() method in the instance', async () => {
    await SafeOnRampKit.init(pack)

    expect(stripePack.StripePack).toHaveBeenCalledWith(expect.objectContaining(config))
    expect(stripePack.StripePack.prototype.init).toHaveBeenCalledWith()
  })

  it('should call the open method in the XXXPack with the corresponding options', async () => {
    const safeOnRampKit = await SafeOnRampKit.init(pack)

    safeOnRampKit.open(openOptions)

    expect(stripePack.StripePack.prototype.open).toHaveBeenCalledWith(
      expect.objectContaining(openOptions)
    )
  })

  it('should call the close method in the XXXPack', async () => {
    const safeOnRampKit = await SafeOnRampKit.init(pack)

    safeOnRampKit.close()

    expect(stripePack.StripePack.prototype.close).toHaveBeenCalled()
  })
})
