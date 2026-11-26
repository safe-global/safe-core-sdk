import { expect } from 'chai'
import { getApiKit } from '../../utils/setupKits'

describe('decoder.getServiceInfo', () => {
  it('should return the Safe Decoder Service info', async () => {
    const serviceInfo = await getApiKit().decoder.getServiceInfo()
    expect(serviceInfo).to.have.property('version').to.be.a('string').not.empty
  })
})
