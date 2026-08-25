import Safe from '@safe-global/protocol-kit'

import { GelatoRelayPack } from './GelatoRelayPack'

jest.mock('@gelatonetwork/relay-sdk', () => ({
  GelatoRelay: jest.fn().mockImplementation(() => ({}))
}))

jest.mock('@safe-global/protocol-kit')

// TODO: Remove @deprecated Gelato code when the pack is removed in the next major version
describe('GelatoRelayPack deprecation notice', () => {
  const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

  afterAll(() => {
    consoleWarnSpy.mockRestore()
  })

  it('should warn once per process when the pack is instantiated', () => {
    const protocolKit = new Safe()

    new GelatoRelayPack({ protocolKit })
    new GelatoRelayPack({ protocolKit })
    new GelatoRelayPack({ apiKey: 'api-key', protocolKit })

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('`GelatoRelayPack` is deprecated')
    )
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('will be removed in the next major version')
    )
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('`Safe4337Pack`'))
  })
})
// END of @deprecated Gelato code
