import { ethers } from 'ethers'
import Safe, {
  hashSafeMessage,
  buildSignatureBytes,
  preimageSafeMessageHash,
  buildContractSignature,
  EthSafeSignature
} from '@safe-global/protocol-kit/index'
import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import { OperationType, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import { SigningMethod } from '@safe-global/protocol-kit/types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments } from 'hardhat'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getSafeWithOwners } from './utils/setupContracts'
import { getEip1193Provider } from './utils/setupProvider'
import { getAccounts } from './utils/setupTestNetwork'
import { waitSafeTxReceipt } from './utils/transactions'
import { itif } from './utils/helpers'
import SafeMessage from '../../src/utils/messages/SafeMessage'
import semverSatisfies from 'semver/functions/satisfies'

chai.use(chaiAsPromised)

export const calculateSafeMessageHash = (
  safeAddress: string,
  message: string,
  chainId: number
): string => {
  return ethers.TypedDataEncoder.hash(
    { verifyingContract: safeAddress, chainId },
    {
      SafeMessage: [{ type: 'bytes', name: 'message' }]
    },
    { message }
  )
}

const MESSAGE = 'I am the owner of this Safe account'

describe('The EIP1271 implementation', () => {
  describe('In the context of a 2/3 Safe and a 1/1 signer Safe account', async () => {
    const setupTests = deployments.createFixture(async ({ deployments, getChainId }) => {
      await deployments.fixture()
      const accounts = await getAccounts()
      const chainId = await getChainId()
      const contractNetworks = await getContractNetworks(BigInt(chainId))
      const fallbackHandlerAddress = contractNetworks[chainId].fallbackHandlerAddress
      const [account1, account2] = accounts
      const provider = getEip1193Provider()

      // Create a 1/2 Safe to sign the messages
      const signerSafe = await getSafeWithOwners(
        [account1.address, account2.address],
        1,
        fallbackHandlerAddress
      )
      const signerSafeAddress = await signerSafe.getAddress()

      // Create a 2/3 Safe
      const safe = await getSafeWithOwners(
        [account1.address, account2.address, signerSafeAddress],
        2,
        fallbackHandlerAddress
      )
      const safeAddress = await safe.getAddress()

      const safeSdk1 = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })

      // Adapter and Safe instance for owner 2
      const safeSdk2 = await Safe.init({
        provider,
        signer: account2.address,
        safeAddress,
        contractNetworks
      })

      // Adapter and Safe instance for owner 3
      const safeSdk3 = await Safe.init({
        provider,
        signer: account1.address,
        safeAddress: signerSafeAddress,
        contractNetworks
      })

      return {
        safe,
        safeAddress,
        signerSafe,
        signerSafeAddress,
        accounts,
        contractNetworks,
        provider,
        chainId,
        safeSdk1,
        safeSdk2,
        safeSdk3,
        fallbackHandlerAddress
      }
    })

    itif(safeVersionDeployed >= '1.3.0')(
      'should validate on-chain messages (Approved hashes)',
      async () => {
        const { contractNetworks, safeSdk1, safeSdk2 } = await setupTests()

        const chainId = await safeSdk1.getChainId()
        const safeVersion = await safeSdk1.getContractVersion()

        const customContract = contractNetworks[chainId.toString()]

        const signMessageLibContract = await safeSdk1.getSafeProvider().getSignMessageLibContract({
          safeVersion,
          customContractAddress: customContract.signMessageLibAddress,
          customContractAbi: customContract.signMessageLibAbi
        })

        const messageHash = hashSafeMessage(MESSAGE)

        const txData = signMessageLibContract.encode('signMessage', [messageHash])

        const safeTransactionData: SafeTransactionDataPartial = {
          to: customContract.signMessageLibAddress,
          value: '0',
          data: txData,
          operation: OperationType.DelegateCall
        }

        const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
        const signedTx = await safeSdk1.signTransaction(tx)
        const signedTx2 = await safeSdk2.signTransaction(signedTx)
        const execResponse = await safeSdk1.executeTransaction(signedTx2)

        await waitSafeTxReceipt(execResponse)

        const validatedResponse1 = await safeSdk1.isValidSignature(messageHash)
        chai.expect(validatedResponse1).to.be.true

        const validatedResponse2 = await safeSdk1.isValidSignature(messageHash, '0x')
        chai.expect(validatedResponse2).to.be.true
      }
    )

    itif(safeVersionDeployed >= '1.3.0')('should revert when message is not signed', async () => {
      const { safeSdk1 } = await setupTests()

      const response = await safeSdk1.isValidSignature(hashSafeMessage(MESSAGE), '0x')

      chai.expect(response).to.be.false
    })

    describe('getSafeMessageHash(), signHash(), signTypedData()', () => {
      itif(safeVersionDeployed >= '1.3.0')(
        'should allow to validate off-chain messages',
        async () => {
          const { safeSdk1, safeSdk2 } = await setupTests()

          // Hash the message
          const messageHash = hashSafeMessage(MESSAGE)
          const safeMessageHash = await safeSdk1.getSafeMessageHash(messageHash)

          // Sign the Safe message hash with the owners
          const ethSignSig1 = await safeSdk1.signHash(safeMessageHash)
          const ethSignSig2 = await safeSdk2.signHash(safeMessageHash)

          // Validate the signature sending the Safe message hash and the concatenated signatures
          const isValid1 = await safeSdk1.isValidSignature(
            messageHash,
            buildSignatureBytes([ethSignSig1, ethSignSig2])
          )

          chai.expect(isValid1).to.be.true

          // Validate the signature sending the Safe message hash and the array of SafeSignature
          const isValid2 = await safeSdk1.isValidSignature(messageHash, [ethSignSig1, ethSignSig2])

          chai.expect(isValid2).to.be.true

          // Validate the signature is not valid when not enough signers has signed
          const isValid3 = await safeSdk1.isValidSignature(messageHash, [ethSignSig1])

          chai.expect(isValid3).to.be.false
        }
      )

      itif(safeVersionDeployed >= '1.3.0')(
        'should validate a mix EIP191 and EIP712 signatures',
        async () => {
          const { safeSdk1, safeSdk2 } = await setupTests()

          // Hash the message
          const messageHash = hashSafeMessage(MESSAGE)
          const safeMessageHash = await safeSdk1.getSafeMessageHash(messageHash)

          // Sign the Safe message with the owners
          const ethSignSig = await safeSdk1.signHash(safeMessageHash)
          const typedDataSig = await safeSdk2.signTypedData(safeSdk2.createMessage(MESSAGE), 'v4')

          // Validate the signature sending the Safe message hash and the concatenated signatures
          const isValid = await safeSdk1.isValidSignature(messageHash, [ethSignSig, typedDataSig])

          chai.expect(isValid).to.be.true
        }
      )

      itif(safeVersionDeployed >= '1.3.0')(
        'should validate Smart contracts as signers (threshold = 1)',
        async () => {
          const { safeSdk1, safeSdk2, safeSdk3, safeAddress, signerSafeAddress } =
            await setupTests()
          // Hash the message
          const messageHash = hashSafeMessage(MESSAGE)
          const safeMessageHash = await safeSdk1.getSafeMessageHash(messageHash)

          // Sign the Safe message with the owners
          const ethSignSig = await safeSdk1.signHash(safeMessageHash)
          const typedDataSig = await safeSdk2.signTypedData(safeSdk2.createMessage(MESSAGE), 'v4')

          // Sign with the Smart contract
          const shouldPreimageMessage = semverSatisfies(
            await safeSdk1.getContractVersion(),
            '>=1.4.1'
          )
          const messageHashData = preimageSafeMessageHash(
            safeAddress,
            messageHash,
            await safeSdk1.getContractVersion(),
            await safeSdk1.getChainId()
          )
          const safeSignerMessageHash = await safeSdk3.getSafeMessageHash(
            shouldPreimageMessage ? messageHashData : messageHash
          )

          const signerSafeSig = await buildContractSignature(
            [await safeSdk3.signHash(safeSignerMessageHash)],
            signerSafeAddress
          )
          // Validate the signature sending the Safe message hash and the concatenated signatures
          const isValid = await safeSdk1.isValidSignature(messageHash, [
            ethSignSig,
            typedDataSig,
            signerSafeSig
          ])

          chai.expect(isValid).to.be.true
        }
      )

      itif(safeVersionDeployed >= '1.3.0')(
        'should allow to validate transaction hashes using smart contracts as signers',
        async () => {
          const { accounts, safeSdk1, safeSdk3, safeAddress, signerSafeAddress } =
            await setupTests()

          const [account1] = accounts

          const safeTransactionData: SafeTransactionDataPartial = {
            to: account1.address,
            value: '100000000000000000', // 0.01 ETH
            data: '0x'
          }

          const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
          const txHash = await safeSdk1.getTransactionHash(tx)
          const safeMessageHash = await safeSdk1.getSafeMessageHash(txHash)
          const signature1 = await safeSdk1.signHash(safeMessageHash)

          const shouldPreimageTxHash = semverSatisfies(
            await safeSdk1.getContractVersion(),
            '>=1.4.1'
          )
          const txHashData = preimageSafeMessageHash(
            safeAddress,
            txHash,
            await safeSdk1.getContractVersion(),
            await safeSdk1.getChainId()
          )

          const signerSafeMessageHash = await safeSdk3.getSafeMessageHash(
            shouldPreimageTxHash ? txHashData : txHash
          )

          const signature2 = await buildContractSignature(
            [await safeSdk3.signHash(signerSafeMessageHash)],
            signerSafeAddress
          )

          const isValidSignature = await safeSdk1.isValidSignature(txHash, [signature1, signature2])
          chai.expect(isValidSignature).to.be.true
        }
      )

      itif(safeVersionDeployed >= '1.3.0')(
        'should generate the correct safeMessageHash',
        async () => {
          const { safeAddress, safeSdk1 } = await setupTests()

          const chainId = await safeSdk1.getChainId()
          const messageHash = hashSafeMessage(MESSAGE)
          const safeMessageHash = await safeSdk1.getSafeMessageHash(messageHash)

          chai
            .expect(safeMessageHash)
            .to.be.eq(calculateSafeMessageHash(safeAddress, messageHash, Number(chainId)))
        }
      )
    })

    describe('signMessage()', () => {
      itif(safeVersionDeployed >= '1.3.0')('should validate off-chain messages', async () => {
        const { safeSdk1, safeSdk2 } = await setupTests()

        // EIP191 sign the Safe message with owners
        const safeMessage = safeSdk1.createMessage(MESSAGE)

        const signedMessage1: SafeMessage = await safeSdk1.signMessage(
          safeMessage,
          SigningMethod.ETH_SIGN
        )
        const signedMessage2: SafeMessage = await safeSdk2.signMessage(
          signedMessage1,
          SigningMethod.ETH_SIGN
        )

        // Validate the signature
        chai.expect(
          await safeSdk1.isValidSignature(
            hashSafeMessage(MESSAGE),
            signedMessage2.encodedSignatures()
          )
        ).to.be.true

        // Validate the signature is not valid when not enough signers has signed
        chai.expect(
          await safeSdk1.isValidSignature(
            hashSafeMessage(MESSAGE),
            signedMessage1.encodedSignatures()
          )
        ).to.be.false
      })

      itif(safeVersionDeployed >= '1.3.0')(
        'should validate a mix EIP191 and EIP712 signatures',
        async () => {
          const { safeSdk1, safeSdk2 } = await setupTests()

          // EIP191 and EIP712 sign the Safe message with owners
          const safeMessage = safeSdk1.createMessage(MESSAGE)

          const signedMessage1: SafeMessage = await safeSdk1.signMessage(
            safeMessage,
            SigningMethod.ETH_SIGN
          )
          const signedMessage2: SafeMessage = await safeSdk2.signMessage(
            signedMessage1,
            SigningMethod.ETH_SIGN_TYPED_DATA_V4
          )

          // Validate the signature
          chai.expect(
            await safeSdk1.isValidSignature(
              hashSafeMessage(MESSAGE),
              signedMessage2.encodedSignatures()
            )
          ).to.be.true
        }
      )

      itif(safeVersionDeployed >= '1.3.0')(
        'should validate Smart contracts as signers (threshold = 1)',
        async () => {
          const { safeSdk1, safeSdk3, safeAddress, signerSafeAddress } = await setupTests()

          // EOA sign
          const safeMessage1 = safeSdk1.createMessage(MESSAGE)
          const signedMessage1: SafeMessage = await safeSdk1.signMessage(safeMessage1)
          const signerAddress1 = (await safeSdk1.getSafeProvider().getSignerAddress()) as string
          const ethSig = signedMessage1.getSignature(signerAddress1) as EthSafeSignature

          // Signer Safe sign
          const safeMessage2 = safeSdk3.createMessage(MESSAGE)
          const signedMessage2: SafeMessage = await safeSdk3.signMessage(
            safeMessage2,
            SigningMethod.SAFE_SIGNATURE,
            safeAddress
          )
          const signerAddress2 = (await safeSdk3.getSafeProvider().getSignerAddress()) as string
          const safeSignerSig = await buildContractSignature(
            [signedMessage2.getSignature(signerAddress2) as EthSafeSignature],
            signerSafeAddress
          )

          // Validate the signature
          chai.expect(
            await safeSdk1.isValidSignature(
              hashSafeMessage(MESSAGE),
              buildSignatureBytes([ethSig, safeSignerSig])
            )
          ).to.be.true
        }
      )

      itif(safeVersionDeployed >= '1.3.0')(
        'should generate the correct safeMessageHash',
        async () => {
          const { safeAddress, safeSdk1 } = await setupTests()

          const chainId = await safeSdk1.getChainId()
          const messageHash = hashSafeMessage(MESSAGE)
          const safeMessageHash = await safeSdk1.getSafeMessageHash(messageHash)

          chai
            .expect(safeMessageHash)
            .to.be.eq(calculateSafeMessageHash(safeAddress, messageHash, Number(chainId)))
        }
      )
    })

    describe('signTransaction()', () => {
      itif(safeVersionDeployed >= '1.3.0')(
        'should allow to sign transactions using other Safe Accounts (threshold = 1)',
        async () => {
          const { safeAddress, accounts, safeSdk1, safeSdk3, signerSafeAddress } =
            await setupTests()

          const [account1] = accounts

          const safeTransactionData: SafeTransactionDataPartial = {
            to: account1.address,
            value: '100000000000000000', // 0.01 ETH
            data: '0x'
          }

          await account1.signer.sendTransaction({
            to: safeAddress,
            value: 1_000_000_000_000_000_000n // 1 ETH
          })

          chai.expect(await safeSdk1.getNonce()).to.be.eq(0)

          // EOA signature
          let tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
          tx = await safeSdk1.signTransaction(tx)

          // Smart contract signature
          let signerSafeTx = await safeSdk1.createTransaction({
            transactions: [safeTransactionData]
          })
          signerSafeTx = await safeSdk3.signTransaction(
            tx,
            SigningMethod.SAFE_SIGNATURE,
            safeAddress
          )
          const signerSafeSig = await buildContractSignature(
            Array.from(signerSafeTx.signatures.values()),
            signerSafeAddress
          )

          tx.addSignature(signerSafeSig)

          const execResponse = await safeSdk1.executeTransaction(tx)
          await waitSafeTxReceipt(execResponse)

          chai.expect(await safeSdk1.getNonce()).to.be.eq(1)
        }
      )
    })
  })
})
