import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient from '../src'
import { getServiceClient } from './utils'

chai.use(chaiAsPromised)

let serviceSdk: SafeServiceClient

describe('getToken', () => {
  before(async () => {
    ;({ serviceSdk } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

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
    const tokenInfoResponse = await serviceSdk.getToken(tokenAddress)
    chai.expect(tokenInfoResponse.address).to.be.equal('0xc778417E063141139Fce010982780140Aa0cD5Ab')
  })
})
