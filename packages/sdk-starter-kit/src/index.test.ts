import { createSafeClient, offChainMessages, onChainMessages } from './index'

const RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com'
const SAFE_ADDRESS = '0x60C4Ab82D06Fd7dFE9517e17736C2Dcc77443EF0'
const SAFE_OWNERS = [
  '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B',
  '0x56e2C102c664De6DfD7315d12c0178b61D16F171'
]

describe('createSafeClient', () => {
  it('should create a Safe client instance', async () => {
    const safeClient = await createSafeClient({
      provider: RPC_URL,
      safeAddress: SAFE_ADDRESS
    })

    const safeAddress = await safeClient.getAddress()
    const owners = await safeClient.getOwners()
    const threshold = await safeClient.getThreshold()

    expect(safeAddress).toBe('0x60C4Ab82D06Fd7dFE9517e17736C2Dcc77443EF0')
    expect(owners).toStrictEqual(SAFE_OWNERS)
    expect(threshold).toBe(1)
  })

  it('should allow to extend the client several times and accumulating methods', async () => {
    const safeClient1 = await createSafeClient({
      provider: RPC_URL,
      safeAddress: SAFE_ADDRESS
    })

    const safeClient2 = safeClient1.extend(offChainMessages())
    const safeClient3 = safeClient2.extend(onChainMessages())

    expect(safeClient3).toBeDefined()
    expect(safeClient3.send).toBeDefined()
    expect(safeClient3.sendOnChainMessage).toBeDefined()
    expect(safeClient3.sendOffChainMessage).toBeDefined()
  })
})
