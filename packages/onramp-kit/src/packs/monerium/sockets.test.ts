import { connectToOrderNotifications } from './sockets'
import { MoneriumWebSocketOptions } from './types'

describe('Sockets', () => {
  it('should create a SafeMoneriumClient instance', () => {
    const params: MoneriumWebSocketOptions = {
      profile: 'profileId',
      accessToken: 'accessToken',
      env: 'sandbox',
      subscriptions: new Map()
    }

    const eventHandler = jest.fn()
    // @ts-expect-error - We don't need to mock all the properties
    jest.spyOn(window, 'WebSocket').mockReturnValue({
      addEventListener: eventHandler
    })

    connectToOrderNotifications(params)

    expect(WebSocket).toHaveBeenCalledWith(
      'wss://api.monerium.dev/profiles/profileId/orders?access_token=accessToken'
    )

    params.env = 'production'

    connectToOrderNotifications(params)

    expect(WebSocket).toHaveBeenCalledWith(
      'wss://api.monerium.app/profiles/profileId/orders?access_token=accessToken'
    )
  })
})
