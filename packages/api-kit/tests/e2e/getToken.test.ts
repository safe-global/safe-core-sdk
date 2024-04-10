import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('getToken', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(
      '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'
    ))
  })

  it('should fail if token address is empty', async () => {
    const tokenAddress = ''
    await chai.expect(safeApiKit.getToken(tokenAddress)).to.be.rejectedWith('Invalid token address')
  })

  it('should fail if token address is not checksummed', async () => {
    const tokenAddress = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'.toLowerCase()
    await chai
      .expect(safeApiKit.getToken(tokenAddress))
      .to.be.rejectedWith('Invalid ethereum address')
  })

  it('should return the token info', async () => {
    const tokenAddress = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'
    const tokenInfoResponse = await safeApiKit.getToken(tokenAddress)
    chai.expect(tokenInfoResponse.address).to.be.equal('0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14')
  })

  it('should return the token info EIP-3770', async () => {
    const tokenAddress = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'
    const eip3770TokenAddress = `${config.EIP_3770_PREFIX}:${tokenAddress}`
    const tokenInfoResponse = await safeApiKit.getToken(eip3770TokenAddress)
    chai.expect(tokenInfoResponse.address).to.be.equal('0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14')
  })
})
