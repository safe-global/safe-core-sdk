import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient from '../../src'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let serviceSdk: SafeServiceClient
const goerliSpendingLimitModule = '0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134'

describe('getSafesByModule', () => {
  before(async () => {
    ;({ serviceSdk } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should fail if owner address is empty', async () => {
    const moduleAddress = ''
    await chai
      .expect(serviceSdk.getSafesByModule(moduleAddress))
      .to.be.rejectedWith('Invalid module address')
  })

  it('should fail if owner address is not checksummed', async () => {
    const moduleAddress = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'.toLowerCase()
    await chai
      .expect(serviceSdk.getSafesByModule(moduleAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return an empty array if there are no Safes with the module enabled', async () => {
    const moduleAddress = '0x0000000000000000000000000000000000000001'
    const moduleResponse = await serviceSdk.getSafesByModule(moduleAddress)
    const { safes } = moduleResponse
    chai.expect(safes.length).to.be.equal(0)
  })

  it('should return the array Safes with the module enabled', async () => {
    const moduleAddress = goerliSpendingLimitModule
    const moduleResponse = await serviceSdk.getSafesByModule(moduleAddress)
    const { safes } = moduleResponse
    chai.expect(safes.length).to.be.greaterThan(10)
  })

  it('should return the array of Safes EIP-3770', async () => {
    const moduleAddress = goerliSpendingLimitModule
    const eip3770ModuleAddress = `${config.EIP_3770_PREFIX}:${moduleAddress}`
    const moduleResponse = await serviceSdk.getSafesByModule(eip3770ModuleAddress)
    const { safes } = moduleResponse
    chai.expect(safes.length).to.be.greaterThan(10)
  })
})
