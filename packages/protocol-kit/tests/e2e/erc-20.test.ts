import Safe, {
  SafeProvider,
  createERC20TokenTransferTransaction,
  getERC20Decimals,
  isGasTokenCompatibleWithHandlePayment
} from '@safe-global/protocol-kit/index'
import { safeVersionDeployed, setupTests, itif } from '@safe-global/testing-kit'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import { getEip1193Provider } from './utils/setupProvider'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'

chai.use(chaiAsPromised)

const ERC20_TOKEN_ADDRESS = '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'

describe('ERC-20 utils', () => {
  let callStub: sinon.SinonStub

  afterEach(() => {
    callStub.restore()
  })

  const provider = getEip1193Provider()

  describe('getERC20Decimals', () => {
    itif(safeVersionDeployed >= '1.3.0')(
      'should return the correct decimals for a standard ERC20 token',
      async () => {
        const { safe, contractNetworks } = await setupTests()

        const safeAddress = safe.address

        // mock decimals() call
        callStub = sinon.stub(SafeProvider.prototype, 'call').returns(Promise.resolve('0x12'))

        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })

        const decimals = await getERC20Decimals(ERC20_TOKEN_ADDRESS, safeSdk)

        chai.expect(decimals).to.be.equal(18) // standard 18 decimals like DAI token
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should return the correct decimals for a non-standard ERC20 token',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const safeAddress = safe.address

        // mock decimals() call
        callStub = sinon.stub(SafeProvider.prototype, 'call').returns(Promise.resolve('0x06'))

        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })

        const decimals = await getERC20Decimals(ERC20_TOKEN_ADDRESS, safeSdk)

        chai.expect(decimals).to.be.equal(6) // non-standard decimals like USDC token
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should throw an error if decimals() fn is not defined',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const safeAddress = safe.address

        // mock decimals() call
        callStub = sinon.stub(SafeProvider.prototype, 'call').returns(Promise.resolve('0x'))

        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })

        await chai
          .expect(getERC20Decimals(ERC20_TOKEN_ADDRESS, safeSdk))
          .to.be.rejectedWith('Invalid ERC-20 decimals')
      }
    )
  })

  describe('isGasTokenCompatibleWithHandlePayment', () => {
    itif(safeVersionDeployed >= '1.3.0')(
      'should return true if it is the Native token',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const safeAddress = safe.address

        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })

        const isCompatible = await isGasTokenCompatibleWithHandlePayment(
          ZERO_ADDRESS, // native token
          safeSdk
        )

        chai.expect(isCompatible).to.be.equal(true)
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should return true if it is an standard ERC20 token',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const safeAddress = safe.address

        // mock decimals() call
        callStub = sinon.stub(SafeProvider.prototype, 'call').returns(Promise.resolve('0x12'))

        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })

        const isCompatible = await isGasTokenCompatibleWithHandlePayment(
          ERC20_TOKEN_ADDRESS,
          safeSdk
        )

        chai.expect(isCompatible).to.be.equal(true) // compatible ERC-20 like DAI token
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should return false for a non-standard ERC20 token',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const safeAddress = safe.address

        // mock decimals() call
        callStub = sinon.stub(SafeProvider.prototype, 'call').returns(Promise.resolve('0x06'))

        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })

        const isCompatible = await isGasTokenCompatibleWithHandlePayment(
          ERC20_TOKEN_ADDRESS,
          safeSdk
        )

        chai.expect(isCompatible).to.be.equal(false) // non-compatible ERC-20 like USDC token
      }
    )
  })

  describe('createERC20TokenTransferTransaction', () => {
    itif(safeVersionDeployed >= '1.3.0')('creates a transaction transfer object', async () => {
      const toAddress = '0xbc2BB26a6d821e69A38016f3858561a1D80d4182'
      const amount = '12345'

      const transfer = createERC20TokenTransferTransaction(ERC20_TOKEN_ADDRESS, toAddress, amount)

      chai.expect(transfer).to.be.deep.equal({
        to: ERC20_TOKEN_ADDRESS,
        value: '0',
        // transfer encoded
        data: '0xa9059cbb000000000000000000000000bc2bb26a6d821e69a38016f3858561a1d80d41820000000000000000000000000000000000000000000000000000000000003039'
      })
    })
  })
})
