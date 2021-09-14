import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient, { TokenInfoResponse } from '../src'
import config from './config'

chai.use(chaiAsPromised)

describe('getToken', () => {
  const serviceSdk = new SafeServiceClient(config.baseUrl)

  it('should fail if token address is empty', async () => {
    const tokenAddress = ''
    await chai.expect(serviceSdk.getToken(tokenAddress)).to.be.rejectedWith('Invalid token address')
  })

  it('should fail if token address is not checksummed', async () => {
    const tokenAddress = '0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase()
    await chai
      .expect(serviceSdk.getToken(tokenAddress))
      .to.be.rejectedWith('Invalid ethereum address')
  })

  it('should return the token info', async () => {
    const tokenAddress = '0xc778417E063141139Fce010982780140Aa0cD5Ab'
    const tokenInfoResponse: TokenInfoResponse = await serviceSdk.getToken(tokenAddress)
    chai.expect(tokenInfoResponse.address).to.be.equal('0xc778417E063141139Fce010982780140Aa0cD5Ab')
  })
})
