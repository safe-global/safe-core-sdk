import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { setupTests, getMultiSendCallOnly } from '@safe-global/testing-kit'
import Safe from '@safe-global/protocol-kit/index'
import { getEip1193Provider } from './utils/setupProvider'
import { OperationType } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'

chai.use(chaiAsPromised)

const AMOUNT_TO_TRANSFER = '500000000000000000' // 0.5 ETH

describe('createTransactionBatch', () => {
  it('should return a batch of the provided transactions', async () => {
    const { safe, contractNetworks } = await setupTests()

    const provider = getEip1193Provider()
    const safeAddress = safe.address

    const safeSdk = await Safe.init({
      provider,
      safeAddress,
      contractNetworks
    })

    const dumpTransfer = {
      to: ZERO_ADDRESS,
      value: AMOUNT_TO_TRANSFER,
      data: '0x',
      operation: OperationType.Call
    }

    const transactions = [dumpTransfer, dumpTransfer]

    const batchTransaction = await safeSdk.createTransactionBatch(transactions)

    const multiSendContractAddress = (await getMultiSendCallOnly()).contract.address

    chai.expect(batchTransaction).to.be.deep.equal({
      to: multiSendContractAddress,
      value: '0',
      data: '0x8d80ff0a000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000aa00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006f05b59d3b20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006f05b59d3b20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    })
  })
})
