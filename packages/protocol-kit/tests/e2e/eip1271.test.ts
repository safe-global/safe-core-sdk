import Safe from '@safe-global/protocol-kit/index'
import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import { OperationType, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, waffle } from 'hardhat'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getSafeWithOwners } from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'
import { waitSafeTxReceipt } from './utils/transactions'
import { itif } from './utils/helpers'
import { BigNumber, ethers } from 'ethers'
import { buildSignature } from '@safe-global/protocol-kit/utils'

chai.use(chaiAsPromised)

export const calculateSafeMessageHash = (
  safeAddress: string,
  message: string,
  chainId: number
): string => {
  return ethers.utils._TypedDataEncoder.hash(
    { verifyingContract: safeAddress, chainId },
    EIP712_SAFE_MESSAGE_TYPE,
    { message }
  )
}

const hashMessage = (message: string): string => {
  return ethers.utils.hashMessage(message)
}

export const EIP712_SAFE_MESSAGE_TYPE = {
  // "SafeMessage(bytes message)"
  SafeMessage: [{ type: 'bytes', name: 'message' }]
}

const MESSAGE = 'I am the owner of this Safe account'

describe.only('EIP1271', () => {
  describe('Using a 2/3 Safe in the context of the EIP1271', async () => {
    const setupTests = deployments.createFixture(async ({ deployments }) => {
      await deployments.fixture()
      const accounts = await getAccounts()
      const chainId: number = (await waffle.provider.getNetwork()).chainId
      const contractNetworks = await getContractNetworks(chainId)

      const [account1, account2] = accounts

      // Create a 1/1 Safe to sign the messages
      const signerSafe = await getSafeWithOwners([accounts[0].address], 1)

      // Create a 2/3 Safe
      const safe = await getSafeWithOwners(
        [accounts[0].address, accounts[1].address, accounts[2].address, signerSafe.address],
        2
      )

      // Adapter and Safe instance for owner 1
      const ethAdapter1 = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter: ethAdapter1,
        safeAddress: safe.address,
        contractNetworks
      })

      // Adapter and Safe instance for owner 2
      const ethAdapter2 = await getEthAdapter(account2.signer)
      const safeSdk2 = await Safe.create({
        ethAdapter: ethAdapter2,
        safeAddress: safe.address,
        contractNetworks
      })

      // Adapter and Safe instance for owner 3
      const ethAdapter3 = await getEthAdapter(signerSafe.signer)
      const safeSdk3 = await Safe.create({
        ethAdapter: ethAdapter3,
        safeAddress: signerSafe.address,
        contractNetworks
      })

      return {
        safe,
        signerSafe,
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

    itif(safeVersionDeployed >= '1.3.0')('should validate on-chain messages', async () => {
      const { contractNetworks, safeSdk1, safeSdk2, ethAdapter1 } = await setupTests()

      const chainId: number = await safeSdk1.getChainId()
      const safeVersion = await safeSdk1.getContractVersion()

      const customContract = contractNetworks[chainId]

      const signMessageLibContract = await ethAdapter1.getSignMessageLibContract({
        safeVersion,
        customContractAddress: customContract.signMessageLibAddress,
        customContractAbi: customContract.signMessageLibAbi
      })

      const txData = signMessageLibContract.encode('signMessage', [hashMessage(MESSAGE)])

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

      const validatedResponse1 = await safeSdk1.isValidSignature(hashMessage(MESSAGE))
      chai.expect(validatedResponse1).to.be.true

      const validatedResponse2 = await safeSdk1.isValidSignature(hashMessage(MESSAGE), '0x')
      chai.expect(validatedResponse2).to.be.true
    })

    itif(safeVersionDeployed >= '1.3.0')('should validate off-chain messages', async () => {
      const { safeSdk1, safeSdk2 } = await setupTests()

      // Hash the message
      const messageHash = hashMessage(MESSAGE)
      // Get the Safe message hash of the hashed message
      const safeMessageHash = await safeSdk1.getMessageHash(messageHash)

      // Sign the Safe message hash with the owners
      const ethSignSig1 = await safeSdk1.signMessageHash(safeMessageHash)
      const ethSignSig2 = await safeSdk2.signMessageHash(safeMessageHash)

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
    })

    itif(safeVersionDeployed >= '1.3.0')(
      'should allow to validate a mix EIP191 and EIP712 signatures',
      async () => {
        const { safeSdk1, safeSdk2 } = await setupTests()

        // Hash the message
        const messageHash = hashMessage(MESSAGE)
        // Get the Safe message hash of the hashed message
        const safeMessageHash = await safeSdk1.getMessageHash(messageHash)

        // Sign the Safe message with the owners
        const ethSignSig = await safeSdk1.signMessageHash(safeMessageHash)
        const typedDataSig = await safeSdk2.signTypedData(messageHash)

        // Validate the signature sending the Safe message hash and the concatenated signatures
        const isValid = await safeSdk1.isValidSignature(messageHash, [typedDataSig, ethSignSig])

        chai.expect(isValid).to.be.true
      }
    )

    describe.only('focus', () => {
      itif(safeVersionDeployed >= '1.3.0')(
        'should allow to use a Smart Contract signatures',
        async () => {
          const { safeSdk1, safeSdk2, safeSdk3 } = await setupTests()

          // Hash the message
          const messageHash = hashMessage(MESSAGE)
          // Get the Safe message hash
          const safeMessageHash = await safeSdk1.getMessageHash(messageHash)

          // Sign the Safe message with the owners
          const ethSignSig = await safeSdk1.signMessageHash(safeMessageHash)
          console.log('signer', await safeSdk1.getEthAdapter().getSignerAddress())
          const typedDataSig = await safeSdk2.signTypedData(messageHash)

          // Sign with the Smart contract
          const signerSafeMessageHash = await safeSdk3.getMessageHash(messageHash)
          const signerSafeSig = await safeSdk3.signMessageHash(signerSafeMessageHash, true)

          // Validate the signature sending the Safe message hash and the concatenated signatures
          const isValid = await safeSdk1.isValidSignature(messageHash, [
            signerSafeSig,
            ethSignSig,
            typedDataSig
          ])

          chai.expect(isValid).to.be.true
        }
      )
    })

    itif(safeVersionDeployed >= '1.3.0')('should revert when message is not signed', async () => {
      const { safeSdk1 } = await setupTests()

      const response = await safeSdk1.isValidSignature(hashMessage(MESSAGE), '0x')

      chai.expect(response).to.be.false
    })

    itif(safeVersionDeployed >= '1.3.0')(
      'should generate the correct safeMessageHash',
      async () => {
        const { safe, safeSdk1 } = await setupTests()

        const chainId = await safeSdk1.getChainId()
        const safeMessageHash = await safeSdk1.getMessageHash(hashMessage(MESSAGE))

        chai
          .expect(safeMessageHash)
          .to.be.eq(calculateSafeMessageHash(safe.address, hashMessage(MESSAGE), chainId))
      }
    )

    it.skip('should allow to use a sign transactions using smart contracts', async () => {
      const { safe, accounts, safeSdk1, safeSdk2 } = await setupTests()

      const [account1, account2] = accounts

      await account1.signer.sendTransaction({
        to: safe.address,
        value: BigNumber.from('1000000000000000000') // 1 ETH
      })

      const balanceBefore = await safeSdk1.getBalance()
      console.log('BALANCE BEFORE: ', balanceBefore.toString())

      const safeTransactionData: SafeTransactionDataPartial = {
        to: account1.address,
        value: '100000000000000000', // 0.01 ETH
        data: '0x'
      }

      const tx = await safeSdk1.createTransaction({ safeTransactionData })

      const signature1 = await safeSdk1.signTypedData(tx)
      const signature2 = await safeSdk2.signTypedData(tx)

      tx.addSignature(signature1)
      tx.addSignature(signature2)

      const execResponse = await safeSdk1.executeTransaction(tx)

      await waitSafeTxReceipt(execResponse)

      const receipt = await waitSafeTxReceipt(execResponse)
      const balanceAfter = await safeSdk1.getBalance()
      console.log('BALANCE AFTER: ', balanceAfter.toString())
      console.log('RECEIPT:', receipt)
      chai.expect(tx.signatures.size).to.be.eq(2)
      chai.expect(await safeSdk1.isValidTransaction(tx)).to.be.true
    })
  })
})
