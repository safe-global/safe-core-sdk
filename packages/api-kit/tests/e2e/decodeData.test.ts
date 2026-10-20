import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import { getApiKit } from '../utils/setupKits'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('decodeData', () => {
  before(async () => {
    safeApiKit = getApiKit()
  })

  it('should fail if data is empty', async () => {
    const data = ''
    await chai.expect(safeApiKit.decodeData(data)).to.be.rejectedWith('Invalid data')
  })

  it('should fail if data is not a hexadecimal string', async () => {
    const data = 'abc'
    await chai
      .expect(safeApiKit.decodeData(data))
      .to.be.rejectedWith("data: String should match pattern '^0x[0-9a-fA-F]*$'")
  })

  it('should fail if the function selector is not found', async () => {
    const data = '0x12345678'
    await chai
      .expect(safeApiKit.decodeData(data))
      .to.be.rejectedWith('Cannot find function selector to decode data')
  })

  it('should decode the data', async () => {
    const data = '0x610b592500000000000000000000000090F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
    const decodedData = await safeApiKit.decodeData(data)
    chai.expect(decodedData.method).to.be.equal('enableModule')
    chai.expect(decodedData.parameters).to.have.length(1)
    chai.expect(decodedData.parameters[0]).to.include({
      name: 'module',
      type: 'address',
      value: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
    })
    chai.expect(decodedData.accuracy).to.be.a('string')
  })

  it('should decode the data and allow to specify the receiving contract', async () => {
    const data = '0x610b592500000000000000000000000090F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
    const to = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
    const decodedData = await safeApiKit.decodeData(data, to)
    chai.expect(decodedData.method).to.be.equal('enableModule')
    chai.expect(decodedData.parameters[0]).to.include({
      name: 'module',
      type: 'address',
      value: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
    })
    chai.expect(decodedData.accuracy).to.be.a('string')
  })
})
