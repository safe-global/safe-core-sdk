import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import SafeApiKit from '@safe-global/api-kit/index'
import * as httpRequests from '@safe-global/api-kit/utils/httpRequests'
import { DEFAULT_DECODER_SERVICE_URL } from '@safe-global/api-kit/utils/config'
import config from '../utils/config'
import { getApiKit } from '../utils/setupKits'

chai.use(chaiAsPromised)
chai.use(sinonChai)

const chainId = 11155111n
const contractAddress = '0x4103eEB76EBBcB652F8B15d3817EBFC07b664b0c'
const eip3770ContractAddress = `${config.EIP_3770_PREFIX}:${contractAddress}`
const data = '0x610b592500000000000000000000000090F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
const baseUrl = `${DEFAULT_DECODER_SERVICE_URL}/api/v1`
const OK = { data: { success: true } }

let safeApiKit: SafeApiKit

describe('Decoder service endpoints', () => {
  let fetchData: sinon.SinonStub

  before(() => {
    safeApiKit = getApiKit()
    fetchData = sinon.stub(httpRequests, 'sendRequest').returns(Promise.resolve(OK))
  })

  after(() => {
    sinon.restore()
  })

  afterEach(() => {
    sinon.resetHistory()
  })

  it('getServiceInfo', async () => {
    await chai.expect(safeApiKit.decoder.getServiceInfo()).to.be.eventually.deep.equals(OK)
    chai.expect(fetchData).to.have.been.calledWith({ url: `${baseUrl}/about`, method: 'get' })
  })

  it('decodeData', async () => {
    await chai.expect(safeApiKit.decoder.decodeData(data)).to.be.eventually.deep.equals(OK)
    chai.expect(fetchData).to.have.been.calledWith({
      url: `${baseUrl}/data-decoder`,
      method: 'post',
      body: { data }
    })
  })

  it('decodeData with the receiving contract sends the chainId', async () => {
    await chai
      .expect(safeApiKit.decoder.decodeData(data, eip3770ContractAddress))
      .to.be.eventually.deep.equals(OK)
    chai.expect(fetchData).to.have.been.calledWith({
      url: `${baseUrl}/data-decoder`,
      method: 'post',
      body: { data, to: contractAddress, chainId: Number(chainId) }
    })
  })

  it('decodeData with empty data', async () => {
    await chai.expect(safeApiKit.decoder.decodeData('')).to.be.rejectedWith('Invalid data')
    chai.expect(fetchData).not.to.have.been.called
  })

  it('getContracts', async () => {
    await chai.expect(safeApiKit.decoder.getContracts()).to.be.eventually.deep.equals(OK)
    chai.expect(fetchData).to.have.been.calledWith({ url: `${baseUrl}/contracts`, method: 'get' })
  })

  it('getContracts with filters', async () => {
    await chai
      .expect(
        safeApiKit.decoder.getContracts({
          chainIds: [1n, 137n],
          trustedForDelegateCall: true,
          limit: 10,
          offset: 5
        })
      )
      .to.be.eventually.deep.equals(OK)
    chai.expect(fetchData).to.have.been.calledWith({
      url: `${baseUrl}/contracts?chain_ids=1&chain_ids=137&trusted_for_delegate_call=true&limit=10&offset=5`,
      method: 'get'
    })
  })

  it('getContract', async () => {
    await chai
      .expect(safeApiKit.decoder.getContract(eip3770ContractAddress, { chainIds: [chainId] }))
      .to.be.eventually.deep.equals(OK)
    chai.expect(fetchData).to.have.been.calledWith({
      url: `${baseUrl}/contracts/${contractAddress}?chain_ids=${chainId}`,
      method: 'get'
    })
    await chai
      .expect(safeApiKit.decoder.getContract(''))
      .to.be.rejectedWith('Invalid contract address')
  })

  it('uses the custom decoderServiceUrl', async () => {
    const apiKit = new SafeApiKit({
      chainId,
      txServiceUrl: 'http://my-custom-tx-service.com/api',
      queueServiceUrl: 'http://my-custom-queue-service.com',
      decoderServiceUrl: 'http://my-custom-decoder-service.com/'
    })
    await chai.expect(apiKit.decoder.decodeData(data)).to.be.fulfilled
    chai.expect(fetchData).to.have.been.calledWith({
      url: 'http://my-custom-decoder-service.com/api/v1/data-decoder',
      method: 'post',
      body: { data }
    })
  })
})
