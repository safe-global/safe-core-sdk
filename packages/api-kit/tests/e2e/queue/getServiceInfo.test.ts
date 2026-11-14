import { expect } from 'chai'
import { getApiKit } from '../../utils/setupKits'

describe('queue.getServiceInfo', () => {
  it('should return the Safe Queue Service info', async () => {
    const serviceInfo = await getApiKit().queue.getServiceInfo()
    expect(serviceInfo).to.have.property('version').to.be.a('string').not.empty
    expect(serviceInfo).to.have.property('buildCommit')
  })
})
