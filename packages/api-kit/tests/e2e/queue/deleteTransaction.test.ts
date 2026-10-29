import Safe, { EthSafeSignature, buildSignatureBytes } from '@safe-global/protocol-kit'
import { SafeTransactionDataPartial } from '@safe-global/types-kit'
import SafeApiKit, { DeleteTransactionProps } from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { createWalletClient, http, toBytes, toHex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { getKits } from '../../utils/setupKits'
import { getSafe, PRIVATE_KEY_1, PRIVATE_KEY_2 } from 'tests/helpers/safe'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit
let protocolKit: Safe

const safeAddress = getSafe().address

const getSigner = (privateKey: string): DeleteTransactionProps['signer'] =>
  createWalletClient({
    chain: sepolia,
    transport: http(),
    account: privateKeyToAccount(privateKey as `0x${string}`)
  })

describe('deleteTransaction', () => {
  before(async () => {
    ;({ safeApiKit, protocolKit } = await getKits({
      signer: PRIVATE_KEY_1,
      safeAddress
    }))
  })

  it('should fail if safeTxHash is empty', async () => {
    await chai
      .expect(
        safeApiKit.queue.deleteTransaction({
          safeTxHash: '',
          safeAddress,
          signer: getSigner(PRIVATE_KEY_1)
        })
      )
      .to.be.rejectedWith('Invalid safeTxHash')
  })

  it('should fail if the transaction does not exist', async () => {
    const safeTxHash = '0x317834aea988fd3cfa54fd8b2be2c96b4fd70a14d8c9470a7110576b01e6480b'
    await chai.expect(
      safeApiKit.queue.deleteTransaction({
        safeTxHash,
        safeAddress,
        signer: getSigner(PRIVATE_KEY_1)
      })
    ).to.be.rejected
  })

  describe('with a proposed transaction', () => {
    let safeTxHash: string

    beforeEach(async () => {
      const safeTransactionData: SafeTransactionDataPartial = {
        to: safeAddress,
        value: '0',
        // We generate unique data from the current timestamp to receive a different tx hash each time
        data: toHex(toBytes(Date.now()))
      }

      let tx = await protocolKit.createTransaction({ transactions: [safeTransactionData] })
      tx = await protocolKit.signTransaction(tx)

      const signerAddress = (await protocolKit.getSafeProvider().getSignerAddress()) || '0x'
      const ethSig = tx.getSignature(signerAddress) as EthSafeSignature

      ;({ safeTxHash } = await safeApiKit.queue.proposeTransaction({
        safeAddress,
        safeTransactionData: tx.data,
        signatures: buildSignatureBytes([ethSig])
      }))
    })

    afterEach(async () => {
      try {
        await safeApiKit.queue.deleteTransaction({
          safeTxHash,
          safeAddress,
          signer: getSigner(PRIVATE_KEY_1)
        })
      } catch {
        // already deleted
      }
    })

    it('should fail if the signer is not the proposer', async () => {
      await chai.expect(
        safeApiKit.queue.deleteTransaction({
          safeTxHash,
          safeAddress,
          signer: getSigner(PRIVATE_KEY_2)
        })
      ).to.be.rejected

      await chai.expect(safeApiKit.queue.getTransaction(safeTxHash)).to.be.fulfilled
    })

    it('should delete the transaction when the signer is the proposer', async () => {
      await chai.expect(
        safeApiKit.queue.deleteTransaction({
          safeTxHash,
          safeAddress,
          signer: getSigner(PRIVATE_KEY_1)
        })
      ).to.be.fulfilled

      await chai.expect(safeApiKit.queue.getTransaction(safeTxHash)).to.be.rejected
    })
  })
})
