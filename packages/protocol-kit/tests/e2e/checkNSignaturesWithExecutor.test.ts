import { safeVersionDeployed, setupTests, itif } from '@safe-global/testing-kit'
import Safe, {
  buildSignatureBytes,
  getSafeContract,
  SafeProvider
} from '@safe-global/protocol-kit/index'
import SafeContract_v1_5_0 from '@safe-global/protocol-kit/contracts/Safe/v1.5.0/SafeContract_v1_5_0'
import { asHash, asHex } from '@safe-global/protocol-kit/utils/types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import semverSatisfies from 'semver/functions/satisfies.js'
import { getEip1193Provider } from './utils/setupProvider'

chai.use(chaiAsPromised)

/**
 * Resolves the typed v1.5.0 Safe contract from a deployed Safe address.
 */
async function getTypedSafeContract(
  safeAddress: string,
  contractNetworks: Record<string, unknown>,
  chainId: bigint,
  provider: ReturnType<typeof getEip1193Provider>
): Promise<SafeContract_v1_5_0> {
  const safeProvider = new SafeProvider({ provider })
  const safeContract = await getSafeContract({
    safeProvider,
    safeVersion: '1.5.0',
    customSafeAddress: safeAddress,
    customContracts: contractNetworks[chainId.toString()] as Parameters<
      typeof getSafeContract
    >[0]['customContracts']
  })
  return safeContract as SafeContract_v1_5_0
}

describe('checkSignaturesWithExecutor and checkNSignaturesWithExecutor', () => {
  const provider = getEip1193Provider()

  /**
   * Shared test setup: deploys a 1-of-1 Safe, creates a transaction,
   * signs the transaction hash with the first owner, and returns
   * all artefacts needed by each test case.
   */
  const buildSignedTxArtefacts = async () => {
    const { safe, accounts, contractNetworks, chainId } = await setupTests()
    const [account1] = accounts
    const safeAddress = safe.address

    const safeSdk = await Safe.init({ provider, safeAddress, contractNetworks })

    // Create an arbitrary zero-value transaction just to obtain a hash.
    const tx = await safeSdk.createTransaction({
      transactions: [{ to: safeAddress, value: '0', data: '0x' }]
    })
    const txHash = await safeSdk.getTransactionHash(tx)

    // Sign with the first (and only) owner.
    const signature = await safeSdk.signHash(txHash)
    const encodedSignatures = asHex(buildSignatureBytes([signature]))

    const safeContract = await getTypedSafeContract(
      safeAddress,
      contractNetworks,
      chainId,
      provider
    )

    return { account1, safeAddress, txHash, encodedSignatures, safeContract }
  }

  describe('checkNSignaturesWithExecutor', async () => {
    itif(semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should resolve without reverting when a valid ECDSA owner signature is provided',
      async () => {
        const { account1, txHash, encodedSignatures, safeContract } = await buildSignedTxArtefacts()

        await chai
          .expect(
            safeContract.checkNSignaturesWithExecutor([
              account1.address as `0x${string}`,
              asHash(txHash),
              encodedSignatures,
              1n
            ])
          )
          .to.eventually.deep.equal([])
      }
    )

    itif(semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should revert when the required signature count exceeds the number of provided signatures',
      async () => {
        const { account1, txHash, encodedSignatures, safeContract } = await buildSignedTxArtefacts()

        await chai.expect(
          safeContract.checkNSignaturesWithExecutor([
            account1.address as `0x${string}`,
            asHash(txHash),
            encodedSignatures,
            2n // requires 2 but only 1 signature provided
          ])
        ).to.be.rejected
      }
    )

    itif(semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should revert when the signature bytes are invalid',
      async () => {
        const { account1, txHash, safeContract } = await buildSignedTxArtefacts()

        // 65 bytes of 0xff – not a valid ECDSA signature.
        const invalidSignature = asHex(`0x${'ff'.repeat(65)}`)

        await chai.expect(
          safeContract.checkNSignaturesWithExecutor([
            account1.address as `0x${string}`,
            asHash(txHash),
            invalidSignature,
            1n
          ])
        ).to.be.rejected
      }
    )
  })

  describe('checkSignaturesWithExecutor', async () => {
    itif(semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should resolve without reverting when a valid ECDSA owner signature is provided',
      async () => {
        const { account1, txHash, encodedSignatures, safeContract } = await buildSignedTxArtefacts()

        await chai
          .expect(
            safeContract.checkSignaturesWithExecutor([
              account1.address as `0x${string}`,
              asHash(txHash),
              encodedSignatures
            ])
          )
          .to.eventually.deep.equal([])
      }
    )

    itif(semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should revert when the signature bytes are invalid',
      async () => {
        const { account1, txHash, safeContract } = await buildSignedTxArtefacts()

        const invalidSignature = asHex(`0x${'ff'.repeat(65)}`)

        await chai.expect(
          safeContract.checkSignaturesWithExecutor([
            account1.address as `0x${string}`,
            asHash(txHash),
            invalidSignature
          ])
        ).to.be.rejected
      }
    )
  })
})
