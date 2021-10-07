import { getDefaultProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient, { SafeDelegateConfig } from '../src'
import config from './config'
chai.use(chaiAsPromised)

describe('removeAllSafeDelegates', () => {
  const serviceSdk = new SafeServiceClient(config.BASE_URL)

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    const provider = getDefaultProvider(config.JSON_RPC)
    const signer = new Wallet(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d', // A Safe owner
      provider
    )
    await chai
      .expect(serviceSdk.removeAllSafeDelegates(safeAddress, signer))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'.toLowerCase()
    const provider = getDefaultProvider(config.JSON_RPC)
    const signer = new Wallet(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d', // A Safe owner
      provider
    )
    await chai
      .expect(serviceSdk.removeAllSafeDelegates(safeAddress, signer))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should fail if Safe does not exist', async () => {
    const safeAddress = '0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e'
    const provider = getDefaultProvider(config.JSON_RPC)
    const signer = new Wallet(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d', // A Safe owner
      provider
    )
    await chai
      .expect(serviceSdk.removeAllSafeDelegates(safeAddress, signer))
      .to.be.rejectedWith(`Safe=${safeAddress} does not exist or it's still not indexed`)
  })

  it('should fail if the signer is not an owner of the Safe', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'
    const provider = getDefaultProvider(config.JSON_RPC)
    const signer = new Wallet(
      '0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773', // Not a Safe owner
      provider
    )
    await chai
      .expect(serviceSdk.removeAllSafeDelegates(safeAddress, signer))
      .to.be.rejectedWith('Signing owner is not an owner of the Safe')
  })

  it('should remove all delegates', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'
    const provider = getDefaultProvider(config.JSON_RPC)
    const signer = new Wallet(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d', // A Safe owner
      provider
    )

    const delegateConfig1: SafeDelegateConfig = {
      safe: safeAddress,
      delegate: '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0',
      signer,
      label: 'Label1'
    }
    const delegateConfig2: SafeDelegateConfig = {
      safe: safeAddress,
      delegate: '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b',
      signer,
      label: 'Label2'
    }
    await serviceSdk.addSafeDelegate(delegateConfig1)
    await serviceSdk.addSafeDelegate(delegateConfig2)
    const { results: initialDelegates } = await serviceSdk.getSafeDelegates(safeAddress)
    chai.expect(initialDelegates.length).to.be.eq(2)

    await serviceSdk.removeAllSafeDelegates(safeAddress, signer)

    const { results: finalDelegates } = await serviceSdk.getSafeDelegates(safeAddress)
    chai.expect(finalDelegates.length).to.be.eq(0)
  })
})
