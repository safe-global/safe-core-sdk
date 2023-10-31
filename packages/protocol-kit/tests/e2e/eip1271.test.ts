import { ethers } from 'ethers'
import Safe from '@safe-global/protocol-kit/index'
import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import {
  OperationType,
  SafeTransaction,
  SafeTransactionDataPartial
} from '@safe-global/safe-core-sdk-types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments } from 'hardhat'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getSafeWithOwners } from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'
import { waitSafeTxReceipt } from './utils/transactions'
import { itif } from './utils/helpers'
import { buildSignature } from '@safe-global/protocol-kit/utils'
import SafeMessage from '../../src/utils/messages/SafeMessage'

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

describe.only('EIP1271', () => {
  describe('Using a 2/3 Safe in the context of the EIP1271', async () => {
    const setupTests = deployments.createFixture(async ({ deployments, getChainId }) => {
      await deployments.fixture()
      const accounts = await getAccounts()
      const chainId: number = await getChainId()
      const contractNetworks = await getContractNetworks(chainId)

      const [account1, account2] = accounts

      // Create a 1/1 Safe to sign the messages
      const signerSafe = await getSafeWithOwners([accounts[0].address], 1)
      const signerSafeAddress = await signerSafe.getAddress()

      // Create a 2/3 Safe
      const safe = await getSafeWithOwners(
        [accounts[0].address, accounts[1].address, signerSafeAddress],
        2
      )
      const safeAddress = await safe.getAddress()

      // Adapter and Safe instance for owner 1
      const ethAdapter1 = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter: ethAdapter1,
        safeAddress: safeAddress,
        contractNetworks
      })

      // Adapter and Safe instance for owner 2
      const ethAdapter2 = await getEthAdapter(account2.signer)
      const safeSdk2 = await Safe.create({
        ethAdapter: ethAdapter2,
        safeAddress: safeAddress,
        contractNetworks
      })

      // Adapter and Safe instance for owner 3
      const ethAdapter3 = await getEthAdapter(account1.signer)
      const safeSdk3 = await Safe.create({
        ethAdapter: ethAdapter3,
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
        chainId,
        ethAdapter1,
        ethAdapter2,
        ethAdapter3,
        safeSdk1,
        safeSdk2,
        safeSdk3
      }
    })

    itif(safeVersionDeployed >= '1.3.0')(
      'should validate on-chain messages (Approved hashes)',
      async () => {
        const { contractNetworks, safeSdk1, safeSdk2, ethAdapter1 } = await setupTests()

        const chainId: number = await safeSdk1.getChainId()
        const safeVersion = await safeSdk1.getContractVersion()

        const customContract = contractNetworks[chainId]

        const signMessageLibContract = await ethAdapter1.getSignMessageLibContract({
          safeVersion,
          customContractAddress: customContract.signMessageLibAddress,
          customContractAbi: customContract.signMessageLibAbi
        })

        const messageHash = safeSdk1.hashSafeMessage(MESSAGE)

        const txData = signMessageLibContract.encode('signMessage', [messageHash])

        const safeTransactionData: SafeTransactionDataPartial = {
          to: customContract.signMessageLibAddress,
          value: '0',
          data: txData,
          operation: OperationType.DelegateCall
        }

        const tx = await safeSdk1.createTransaction({ safeTransactionData })
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

      const response = await safeSdk1.isValidSignature(
        await safeSdk1.hashSafeMessage(MESSAGE),
        '0x'
      )

      chai.expect(response).to.be.false
    })

    describe('getSafeMessageHash(), signHash(), signTypedData()', () => {
      itif(safeVersionDeployed >= '1.3.0')(
        'should allow to validate off-chain messages',
        async () => {
          const { safeSdk1, safeSdk2 } = await setupTests()

          // Hash the message
          const messageHash = await safeSdk1.hashSafeMessage(MESSAGE)
          const safeMessageHash = await safeSdk1.getSafeMessageHash(messageHash)

          // Sign the Safe message hash with the owners
          const ethSignSig1 = await safeSdk1.signHash(safeMessageHash)
          const ethSignSig2 = await safeSdk2.signHash(safeMessageHash)

          // Validate the signature sending the Safe message hash and the concatenated signatures
          const isValid1 = await safeSdk1.isValidSignature(
            messageHash,
            buildSignature([ethSignSig1, ethSignSig2])
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
          const messageHash = await safeSdk1.hashSafeMessage(MESSAGE)
          const safeMessageHash = await safeSdk1.getSafeMessageHash(messageHash)

          // Sign the Safe message with the owners
          const ethSignSig = await safeSdk1.signHash(safeMessageHash)
          const typedDataSig = await safeSdk2.signTypedData(safeSdk2.createMessage(MESSAGE))

          // Validate the signature sending the Safe message hash and the concatenated signatures
          const isValid = await safeSdk1.isValidSignature(messageHash, [ethSignSig, typedDataSig])

          chai.expect(isValid).to.be.true
        }
      )

      itif(safeVersionDeployed >= '1.3.0')(
        'should validate Smart contracts as signers (threshold = 1)',
        async () => {
          const { safeSdk1, safeSdk2, safeSdk3 } = await setupTests()

          // Hash the message
          const messageHash = await safeSdk1.hashSafeMessage(MESSAGE)
          const safeMessageHash = await safeSdk1.getSafeMessageHash(messageHash)

          // Sign the Safe message with the owners
          const ethSignSig = await safeSdk1.signHash(safeMessageHash)
          const typedDataSig = await safeSdk2.signTypedData(safeSdk2.createMessage(MESSAGE))

          // Sign with the Smart contract
          const safeSignerMessageHash = await safeSdk3.getSafeMessageHash(messageHash)
          const signerSafeSig = await safeSdk3.signHash(safeSignerMessageHash, true)

          // Validate the signature sending the Safe message hash and the concatenated signatures
          const isValid = await safeSdk1.isValidSignature(messageHash, [
            signerSafeSig,
            ethSignSig,
            typedDataSig
          ])

          chai.expect(isValid).to.be.true
        }
      )

      it('should allow to validate transaction hashes using smart contracts as signers', async () => {
        const { safeAddress, accounts, safeSdk1, safeSdk3 } = await setupTests()

        const [account1] = accounts

        const safeTransactionData: SafeTransactionDataPartial = {
          to: account1.address,
          value: '100000000000000000', // 0.01 ETH
          data: '0x'
        }

        const tx = await safeSdk1.createTransaction({ safeTransactionData })
        const txHash = await safeSdk1.getTransactionHash(tx)
        const safeMessageHash = await safeSdk1.getSafeMessageHash(txHash)

        const signature1 = await safeSdk1.signHash(safeMessageHash)
        const signature2 = await safeSdk3.signHash(await safeSdk3.getSafeMessageHash(txHash), true)

        const isValidSignature = await safeSdk1.isValidSignature(txHash, [signature1, signature2])
        chai.expect(isValidSignature).to.be.true

        await account1.signer.sendTransaction({
          to: safeAddress,
          value: 1_000_000_000_000_000_000n // 1 ETH
        })

        // FIXME: From this test we should be able to send a transaction but it fails. Ask to someone in the protocol team
        // ------
        // tx.addSignature(signature1)
        // tx.addSignature(signature2)
        // const execResponse = await safeSdk1.executeTransaction(tx, { gasLimit: 1000000 })
        // const receipt = await waitSafeTxReceipt(execResponse)
        // console.log('RECEIPT:', receipt)
        // chai.expect(receipt?.status).to.be.eq(1)
      })

      itif(safeVersionDeployed >= '1.3.0')(
        'should generate the correct safeMessageHash',
        async () => {
          const { safeAddress, safeSdk1 } = await setupTests()

          const chainId = await safeSdk1.getChainId()
          const messageHash = await safeSdk1.hashSafeMessage(MESSAGE)
          const safeMessageHash = await safeSdk1.getSafeMessageHash(messageHash)

          chai
            .expect(safeMessageHash)
            .to.be.eq(calculateSafeMessageHash(safeAddress, messageHash, chainId))
        }
      )
    })

    describe('signMessage()', () => {
      itif(safeVersionDeployed >= '1.3.0')('should validate off-chain messages', async () => {
        const { safeSdk1, safeSdk2 } = await setupTests()

        // EIP191 sign the Safe message with owners
        const safeMessage = safeSdk1.createMessage(MESSAGE)

        const signedMessage1: SafeMessage = await safeSdk1.signMessage(safeMessage, 'eth_sign')
        const signedMessage2: SafeMessage = await safeSdk2.signMessage(signedMessage1, 'eth_sign')

        // Validate the signature
        chai.expect(
          await safeSdk1.isValidSignature(
            safeSdk1.hashSafeMessage(MESSAGE),
            signedMessage2.encodedSignatures()
          )
        ).to.be.true

        // Validate the signature is not valid when not enough signers has signed
        chai.expect(
          await safeSdk1.isValidSignature(
            safeSdk1.hashSafeMessage(MESSAGE),
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

          const signedMessage1: SafeMessage = await safeSdk1.signMessage(safeMessage, 'eth_sign')
          const signedMessage2: SafeMessage = await safeSdk2.signMessage(
            signedMessage1,
            'eth_signTypedData_v4'
          )

          // Validate the signature
          chai.expect(
            await safeSdk1.isValidSignature(
              safeSdk1.hashSafeMessage(MESSAGE),
              signedMessage2.encodedSignatures()
            )
          ).to.be.true
        }
      )

      itif(safeVersionDeployed >= '1.3.0')(
        'should validate Smart contracts as signers (threshold = 1)',
        async () => {
          const { safeSdk1, safeSdk3 } = await setupTests()

          // Sign the Safe message with owners
          const safeMessage = safeSdk1.createMessage(MESSAGE)

          const signedMessage1: SafeMessage = await safeSdk1.signMessage(safeMessage, 'eth_sign')
          const signedMessage2: SafeMessage = await safeSdk3.signMessage(
            signedMessage1,
            'eth_sign',
            true
          )

          // Validate the signature
          chai.expect(
            await safeSdk1.isValidSignature(
              safeSdk1.hashSafeMessage(MESSAGE),
              signedMessage2.encodedSignatures()
            )
          ).to.be.true
        }
      )

      itif(safeVersionDeployed >= '1.3.0')(
        'should generate the correct safeMessageHash',
        async () => {
          const { safeAddress, safeSdk1 } = await setupTests()

          const chainId = await safeSdk1.getChainId()
          const messageHash = safeSdk1.hashSafeMessage(MESSAGE)
          const safeMessageHash = await safeSdk1.getSafeMessageHash(messageHash)

          chai
            .expect(safeMessageHash)
            .to.be.eq(calculateSafeMessageHash(safeAddress, messageHash, chainId))
        }
      )
    })

    // FIXME: Cannot execute transaction
    it.skip('should allow to sign transactions using other Safe Accounts (threshold = 1)', async () => {
      const { safeAddress, accounts, safeSdk1, safeSdk3 } = await setupTests()

      const [account1] = accounts

      await account1.signer.sendTransaction({
        to: safeAddress,
        value: 1_000_000_000_000_000_000n // 1 ETH
      })

      const balanceBefore = await safeSdk1.getBalance()
      console.log('BALANCE BEFORE: ', balanceBefore.toString())

      const safeTransactionData: SafeTransactionDataPartial = {
        to: account1.address,
        value: '100000000000000000', // 0.01 ETH
        data: '0x'
      }

      const tx = await safeSdk1.createTransaction({ safeTransactionData })

      const signedTx1 = await safeSdk1.signTransaction(tx)
      const signedTx2 = await safeSdk3.signTransaction(signedTx1, 'eth_sign', true)

      const execResponse = await safeSdk1.executeTransaction(signedTx2, { gasLimit: 1000000 })
      const receipt = await waitSafeTxReceipt(execResponse)
      console.log('RECEIPT:', receipt)
      chai.expect(receipt?.status).to.be.eq(1)
    })
  })
})
