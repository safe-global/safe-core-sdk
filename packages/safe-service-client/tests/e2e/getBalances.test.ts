import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient from '../../src'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let serviceSdk: SafeServiceClient

describe('getBalances', () => {
  before(async () => {
    ;({ serviceSdk } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(serviceSdk.getBalances(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'.toLowerCase()
    await chai
      .expect(serviceSdk.getBalances(safeAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return the list of balances', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const balances = await serviceSdk.getBalances(safeAddress)
    chai.expect(balances.length).to.be.equal(2)
    const ethBalance = balances.filter((safeBalance) => !safeBalance.tokenAddress)[0]
    chai.expect(ethBalance.token).to.be.equal(null)
    chai.expect(ethBalance.balance).to.be.equal('100000000000000000')
    const usdcBalance = balances.filter(
      (safeBalance) => safeBalance.tokenAddress === '0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C'
    )[0]
    chai.expect(usdcBalance.token.symbol).to.be.equal('USDC')
    chai.expect(usdcBalance.balance).to.be.equal('1000000000')
  })

  it('should return the list of balances EIP-3770', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const balances = await serviceSdk.getBalances(eip3770SafeAddress)
    chai.expect(balances.length).to.be.equal(2)
    const ethBalance = balances.filter((safeBalance) => !safeBalance.tokenAddress)[0]
    chai.expect(ethBalance.token).to.be.equal(null)
    chai.expect(ethBalance.balance).to.be.equal('100000000000000000')
    const usdcBalance = balances.filter(
      (safeBalance) => safeBalance.tokenAddress === '0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C'
    )[0]
    chai.expect(usdcBalance.token.symbol).to.be.equal('USDC')
    chai.expect(usdcBalance.balance).to.be.equal('1000000000')
  })
})
