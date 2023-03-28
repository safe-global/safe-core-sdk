import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('decodeData', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should fail if data is empty', async () => {
    const data = ''
    await chai.expect(safeApiKit.decodeData(data)).to.be.rejectedWith('Invalid data')
  })

  it('should fail if data is invalid', async () => {
    const data = '0x1'
    await chai
      .expect(safeApiKit.decodeData(data))
      .to.be.rejectedWith('Ensure this field has at least 1 hexadecimal chars (not counting 0x).')
  })

  it('should fail if the function selector is not found', async () => {
    const data = '0x123456789'
    await chai.expect(safeApiKit.decodeData(data)).to.be.rejectedWith('Not Found')
  })

  it('should decode the data', async () => {
    const data = '0x610b592500000000000000000000000090F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
    const decodedData = await safeApiKit.decodeData(data)
    chai.expect(JSON.stringify(decodedData)).to.be.equal(
      JSON.stringify({
        method: 'enableModule',
        parameters: [
          {
            name: 'module',
            type: 'address',
            value: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
          }
        ]
      })
    )
  })
})
