import Safe, { buildContractSignature, hashSafeMessage } from '@safe-global/protocol-kit/index'
import {
  safeVersionDeployed,
  setupTests as testingKitSetupTests,
  getSafeWithOwners,
  itif
} from '@safe-global/testing-kit'
import { SafeTransactionDataPartial, SigningMethod } from '@safe-global/types-kit'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getEip1193Provider } from './utils/setupProvider'
import { waitSafeTxReceipt } from './utils/transactions'

chai.use(chaiAsPromised)

describe('The EIP1271 implementation', () => {
  describe('In the context of a 3/3 Safe account with a 4/4 signer Safe account owner', async () => {
    const setupTests = async () => {
      const { chainId, accounts, contractNetworks } = await testingKitSetupTests()
      const fallbackHandlerAddress = contractNetworks[Number(chainId)].fallbackHandlerAddress
      const [account1, account2, account3, account4, account5] = accounts
      const provider = getEip1193Provider()

      // Create a 1/1 signer Safe
      const signerSafe1_1 = await getSafeWithOwners(
        [account3.address],
        1, // Require 1 signatures
        fallbackHandlerAddress
      )
      const signerSafeAddress1_1 = signerSafe1_1.address

      // Create a 2/3 signer Safe
      const signerSafe2_3 = await getSafeWithOwners(
        [account4.address, account5.address],
        2, // Require 2 signatures
        fallbackHandlerAddress
      )
      const signerSafeAddress2_3 = signerSafe2_3.address

      // Create a 3/4 Safe with the signer Safe as owner
      const safe = await getSafeWithOwners(
        [account1.address, account2.address, signerSafeAddress1_1, signerSafeAddress2_3],
        4, // Require 4 signatures
        fallbackHandlerAddress
      )

      const safeAddress = safe.address

      return {
        safe,
        safeAddress,
        signerSafe1_1,
        signerSafeAddress1_1,
        signerSafe2_3,
        signerSafeAddress2_3,
        accounts,
        contractNetworks,
        chainId,
        fallbackHandlerAddress,
        provider
      }
    }

    itif(safeVersionDeployed >= '1.3.0')(
      'should allow to sign and execute transactions',
      async () => {
        const {
          safeAddress,
          accounts,
          signerSafeAddress1_1,
          signerSafeAddress2_3,
          contractNetworks,
          provider
        } = await setupTests()

        // Create adapters and the protocol kit instance
        const [account1, account2, account3, account4, account5] = accounts

        let protocolKit = await Safe.init({
          provider: provider,
          safeAddress,
          contractNetworks
        })

        // Create the transaction. Send 0.01 ETH to account1
        const safeTransactionData: SafeTransactionDataPartial = {
          to: account1.address,
          value: '100000000000000000', // 0.01 ETH
          data: '0x'
        }

        let tx = await protocolKit.createTransaction({ transactions: [safeTransactionData] })

        chai.expect(await protocolKit.getNonce()).to.be.eq(0)

        // EOA signatures
        tx = await protocolKit.signTransaction(tx) // Owner 1 signature
        protocolKit = await protocolKit.connect({
          signer: account2.address
        }) // Connect another owner
        tx = await protocolKit.signTransaction(tx) // Owner 2 signature

        // 1/1 Signer Safe signature
        protocolKit = await protocolKit.connect({
          signer: account3.address,
          safeAddress: signerSafeAddress1_1
        })
        let signerSafeTx1_1 = await protocolKit.createTransaction({
          transactions: [safeTransactionData]
        })
        signerSafeTx1_1 = await protocolKit.signTransaction(
          signerSafeTx1_1,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        const signerSafeSig1_1 = await buildContractSignature(
          Array.from(signerSafeTx1_1.signatures.values()),
          signerSafeAddress1_1
        )
        tx.addSignature(signerSafeSig1_1)

        // 2/3 Signer Safe signature
        protocolKit = await protocolKit.connect({
          signer: account4.address,
          safeAddress: signerSafeAddress2_3
        })
        let signerSafeTx2_3 = await protocolKit.createTransaction({
          transactions: [safeTransactionData]
        })
        signerSafeTx2_3 = await protocolKit.signTransaction(
          signerSafeTx2_3,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        protocolKit = await protocolKit.connect({
          signer: account5.address
        })
        signerSafeTx2_3 = await protocolKit.signTransaction(
          signerSafeTx2_3,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        const signerSafeSig2_3 = await buildContractSignature(
          Array.from(signerSafeTx2_3.signatures.values()),
          signerSafeAddress2_3
        )
        tx.addSignature(signerSafeSig2_3)

        // Connect the original Safe, send some funds and execute the transaction
        await account1.signer.sendTransaction({
          to: safeAddress,
          value: 1_000_000_000_000_000_000n // 1 ETH
        })
        protocolKit = await protocolKit.connect({
          provider: provider,
          signer: account1.address,
          safeAddress
        })
        const execResponse = await protocolKit.executeTransaction(tx)

        await waitSafeTxReceipt(execResponse)

        // Ensure the nonce has been increased
        chai.expect(await protocolKit.getNonce()).to.be.eq(1)
      }
    )

    // Regression test: signTransaction(tx, SigningMethod.SAFE_SIGNATURE, preimageSafeAddress) used to
    // read `.data` off the *raw* input parameter instead of the converted `transaction` local when the
    // input was a SafeMultisigTransactionResponse (i.e. `.data` is a calldata hex string, not a
    // SafeTransactionData object) - this only affects Safe versions in [1.3.0, 1.5.0) since >=1.5.0 uses
    // a different (correct) code path.
    itif(safeVersionDeployed >= '1.3.0' && safeVersionDeployed < '1.5.0')(
      'should allow contract signatures for a SafeMultisigTransactionResponse-shaped input',
      async () => {
        const { safeAddress, accounts, signerSafeAddress1_1, contractNetworks, provider } =
          await setupTests()
        const [, , account3] = accounts

        const safeTransactionData: SafeTransactionDataPartial = {
          to: safeAddress,
          value: '0',
          data: '0x'
        }

        // Reference: build + sign the SAME transaction as a proper SafeTransaction (the already-working
        // code path), to compare the resulting signature against.
        const referenceProtocolKit = await Safe.init({
          provider,
          safeAddress: signerSafeAddress1_1,
          signer: account3.address,
          contractNetworks
        })
        let referenceTx = await referenceProtocolKit.createTransaction({
          transactions: [safeTransactionData]
        })
        referenceTx = await referenceProtocolKit.signTransaction(
          referenceTx,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        const referenceSignature = Array.from(referenceTx.signatures.values())[0].data

        // Now build the SAME logical transaction, but shaped as a SafeMultisigTransactionResponse -
        // the shape returned by the Safe transaction service - which is what isSafeMultisigTransactionResponse
        // detects via `.isExecuted !== undefined`, and drives the buggy `>=1.3.0 && <1.5.0` branch.
        const responseShapedProtocolKit = await Safe.init({
          provider,
          safeAddress: signerSafeAddress1_1,
          signer: account3.address,
          contractNetworks
        })
        const nonce = await responseShapedProtocolKit.getNonce()
        const responseShapedTx = {
          safe: signerSafeAddress1_1,
          to: safeAddress,
          value: '0',
          data: '0x',
          operation: 0,
          gasToken: '0x0000000000000000000000000000000000000000',
          safeTxGas: '0',
          baseGas: '0',
          gasPrice: '0',
          refundReceiver: '0x0000000000000000000000000000000000000000',
          nonce: nonce.toString(),
          executionDate: null,
          submissionDate: new Date().toISOString(),
          modified: new Date().toISOString(),
          blockNumber: null,
          transactionHash: null,
          safeTxHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          executor: null,
          proposer: null,
          proposedByDelegate: null,
          isExecuted: false,
          isSuccessful: null,
          ethGasPrice: null,
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasUsed: null,
          fee: null,
          origin: '',
          confirmationsRequired: 1,
          confirmations: [],
          trusted: true,
          signatures: null
        }

        // Before the fix, this rejects with a TypeError deep inside the EIP-712 encoder (undefined.length
        // / undefined.to) - the response's raw `.data` string gets treated as the whole SafeTransactionData
        // object. After the fix it resolves, and produces the IDENTICAL signature as the reference
        // SafeTransaction path above, proving the fix doesn't just avoid the crash but computes the
        // correct preimage hash.
        const signedResponseShapedTx = await responseShapedProtocolKit.signTransaction(
          responseShapedTx,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        const responseShapedSignature = Array.from(signedResponseShapedTx.signatures.values())[0]
          .data

        chai.expect(responseShapedSignature).to.equal(referenceSignature)
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should allow to sign and validate typed messages',
      async () => {
        const {
          safeAddress,
          accounts,
          signerSafeAddress1_1,
          signerSafeAddress2_3,
          contractNetworks,
          chainId,
          provider
        } = await setupTests()

        const MESSAGE = {
          types: {
            EIP712Domain: [
              { name: 'name', type: 'string' },
              { name: 'version', type: 'string' },
              { name: 'chainId', type: 'uint256' },
              { name: 'verifyingContract', type: 'address' }
            ],
            Person: [
              { name: 'name', type: 'string' },
              { name: 'wallets', type: 'address[]' }
            ],
            Mail: [
              { name: 'from', type: 'Person' },
              { name: 'to', type: 'Person[]' },
              { name: 'contents', type: 'string' }
            ]
          },
          domain: {
            name: 'Ether Mail',
            version: '1',
            chainId: Number(chainId),
            verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
          },
          primaryType: 'Mail',
          message: {
            from: {
              name: 'Cow',
              wallets: [
                '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
                '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF'
              ]
            },
            to: [
              {
                name: 'Bob',
                wallets: [
                  '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                  '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
                  '0xB0B0b0b0b0b0B000000000000000000000000000'
                ]
              }
            ],
            contents: 'Hello, Bob!'
          }
        }

        // Create adapters and the protocol kit instance
        const [account1, account2, account3, account4, account5] = accounts

        let protocolKit = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })

        let message = protocolKit.createMessage(MESSAGE)

        // EOA signatures
        message = await protocolKit.signMessage(message) // Owner 1 signature
        protocolKit = await protocolKit.connect({
          signer: account2.address
        }) // Connect another owner
        message = await protocolKit.signMessage(message) // Owner 2 signature

        // 1/1 Signer Safe signature
        protocolKit = await protocolKit.connect({
          signer: account3.address,
          safeAddress: signerSafeAddress1_1
        })
        let signerSafeMessage1_1 = protocolKit.createMessage(MESSAGE)
        signerSafeMessage1_1 = await protocolKit.signMessage(
          signerSafeMessage1_1,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        const signerSafeSig1_1 = await buildContractSignature(
          Array.from(signerSafeMessage1_1.signatures.values()),
          signerSafeAddress1_1
        )
        message.addSignature(signerSafeSig1_1)

        // 2/3 Signer Safe signature
        protocolKit = await protocolKit.connect({
          signer: account4.address,
          safeAddress: signerSafeAddress2_3
        })
        let signerSafeMessage2_3 = protocolKit.createMessage(MESSAGE)
        signerSafeMessage2_3 = await protocolKit.signMessage(
          signerSafeMessage2_3,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        protocolKit = await protocolKit.connect({
          signer: account5.address
        })
        signerSafeMessage2_3 = await protocolKit.signMessage(
          signerSafeMessage2_3,
          SigningMethod.SAFE_SIGNATURE,
          safeAddress
        )
        const signerSafeSig2_3 = await buildContractSignature(
          Array.from(signerSafeMessage2_3.signatures.values()),
          signerSafeAddress2_3
        )
        message.addSignature(signerSafeSig2_3)

        // Connect the original Safe
        protocolKit = await protocolKit.connect({
          signer: account1.address,
          safeAddress
        })

        chai.expect(
          await protocolKit.isValidSignature(hashSafeMessage(MESSAGE), message.encodedSignatures())
        ).to.be.true
      }
    )
  })
})
