import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient, { SafeBalanceResponse } from '../src'
import config from './config'

chai.use(chaiAsPromised)

describe('getBalances', () => {
  const serviceSdk = new SafeServiceClient(config.baseUrl)

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(serviceSdk.getBalances(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'.toLowerCase()
    await chai
      .expect(serviceSdk.getBalances(safeAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return the list of balances', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'
    const balances: SafeBalanceResponse[] = await serviceSdk.getBalances(safeAddress)
    chai.expect(balances.length).to.be.equal(2)
    const ethBalance = balances.filter((safeBalance) => !safeBalance.tokenAddress)[0]
    chai.expect(ethBalance.token).to.be.equal(null)
    chai.expect(ethBalance.balance).to.be.equal('4000000000000000000')
    const wethBalance = balances.filter(
      (safeBalance) => safeBalance.tokenAddress === '0xc778417E063141139Fce010982780140Aa0cD5Ab'
    )[0]
    chai.expect(wethBalance.token.symbol).to.be.equal('WETH')
    chai.expect(wethBalance.balance).to.be.equal('10000000000000000')
  })
})
