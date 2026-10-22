import { Address, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import SafeApiKit, { UpdateDelegateProps } from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getApiKit } from '../../utils/setupKits'
import { getSafe, PRIVATE_KEY_2 } from '../../helpers/safe'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit
let signer: UpdateDelegateProps['signer']
let delegatorAddress: Address

const { address: safeAddress, version } = getSafe()
const delegateAddress = '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b'

describe(`[${version}] updateSafeDelegate`, () => {
  before(() => {
    safeApiKit = getApiKit()
    signer = createWalletClient({
      chain: sepolia,
      transport: http(),
      account: privateKeyToAccount(PRIVATE_KEY_2)
    })
    delegatorAddress = signer.account.address
  })

  // Runs before and after each test, so a failed run cannot leave the delegate behind
  const cleanup = async () => {
    try {
      await safeApiKit.queue.removeDelegate({
        safeAddress,
        delegateAddress,
        delegatorAddress,
        signer
      })
    } catch {
      // nothing to remove
    }
  }
  beforeEach(cleanup)
  afterEach(cleanup)

  it('should fail if Label is empty', async () => {
    await chai
      .expect(
        safeApiKit.queue.updateDelegate({
          safeAddress,
          delegateAddress,
          delegatorAddress,
          signer,
          label: ''
        })
      )
      .to.be.rejectedWith('Invalid label')
  })

  it('should fail if the delegate does not exist', async () => {
    await chai.expect(
      safeApiKit.queue.updateDelegate({
        safeAddress,
        delegateAddress,
        delegatorAddress,
        signer,
        label: 'Label'
      })
    ).to.be.rejected
  })

  it('should update the label of a delegate', async () => {
    const delegateConfig = { safeAddress, delegateAddress, delegatorAddress, signer }

    await safeApiKit.queue.addDelegate({ ...delegateConfig, label: 'Label' })

    const delegateResponse = await safeApiKit.queue.updateDelegate({
      ...delegateConfig,
      label: 'New label'
    })
    chai.expect(delegateResponse.label).to.be.equal('New label')
    chai.expect(delegateResponse.delegate.toLowerCase()).to.be.equal(delegateAddress.toLowerCase())

    const { results } = await safeApiKit.queue.getDelegates({ safeAddress, delegateAddress })
    chai.expect(results.length).to.be.eq(1)
    chai.expect(results[0].label).to.be.equal('New label')
  })
})
