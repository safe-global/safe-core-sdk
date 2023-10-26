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
import { ethers } from 'ethers'
import { buildSignature } from '@safe-global/protocol-kit/utils'

chai.use(chaiAsPromised)

export const preimageSafeTransactionHash = (
  safeAddress: string,
  safeTx: SafeTransaction,
  chainId: number
): string => {
  // FIXME
  return ''
  // return ethers.utils._TypedDataEncoder.encode(
  //   { verifyingContract: safeAddress, chainId },
  //   {
  //     // "SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"
  //     SafeTx: [
  //       { type: 'address', name: 'to' },
  //       { type: 'uint256', name: 'value' },
  //       { type: 'bytes', name: 'data' },
  //       { type: 'uint8', name: 'operation' },
  //       { type: 'uint256', name: 'safeTxGas' },
  //       { type: 'uint256', name: 'baseGas' },
  //       { type: 'uint256', name: 'gasPrice' },
  //       { type: 'address', name: 'gasToken' },
  //       { type: 'address', name: 'refundReceiver' },
  //       { type: 'uint256', name: 'nonce' }
  //     ]
  //   },
  //   safeTx.data
  // )
}

export const calculateSafeMessageHash = (
  safeAddress: string,
  message: string,
  chainId: number
): string => {
  // FIXME
  return ''
  // return ethers.utils._TypedDataEncoder.hash(
  //   { verifyingContract: safeAddress, chainId },
  //   {
  //     SafeMessage: [{ type: 'bytes', name: 'message' }]
  //   },
  //   { message }
  // )
}

const MESSAGE = 'I am the owner of this Safe account'

describe.skip('EIP1271', () => {
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

      // Adapter and Safe instance for owner 1
      const ethAdapter1 = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter: ethAdapter1,
        safeAddress: signerSafeAddress,
        contractNetworks
      })

      // Adapter and Safe instance for owner 2
      const ethAdapter2 = await getEthAdapter(account2.signer)
      const safeSdk2 = await Safe.create({
        ethAdapter: ethAdapter2,
        safeAddress: signerSafeAddress,
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

        const messageHash = await safeSdk1.getHash(MESSAGE)

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

    itif(safeVersionDeployed >= '1.3.0')('should validate off-chain messages', async () => {
      const { safeSdk1, safeSdk2 } = await setupTests()

      // Hash the message
      const messageHash = await safeSdk1.getHash(MESSAGE)
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
    })

    itif(safeVersionDeployed >= '1.3.0')(
      'should validate a mix EIP191 and EIP712 signatures',
      async () => {
        const { safeSdk1, safeSdk2 } = await setupTests()

        // Hash the message
        const messageHash = await safeSdk1.getHash(MESSAGE)
        const safeMessageHash = await safeSdk1.getSafeMessageHash(messageHash)

        // Sign the Safe message with the owners
        const ethSignSig = await safeSdk1.signHash(safeMessageHash)

        const typedDataSig = await safeSdk2.signTypedData(MESSAGE)
        // Validate the signature sending the Safe message hash and the concatenated signatures
        const isValid = await safeSdk1.isValidSignature(messageHash, [typedDataSig, ethSignSig])

        chai.expect(isValid).to.be.true
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should validate Smart contracts as signers (threshold = 1)',
      async () => {
        const { safeSdk1, safeSdk2, safeSdk3 } = await setupTests()

        // Hash the message
        const messageHash = await safeSdk1.getHash(MESSAGE)
        const safeMessageHash = await safeSdk1.getSafeMessageHash(messageHash)

        // Sign the Safe message with the owners
        const ethSignSig = await safeSdk1.signHash(safeMessageHash)
        const typedDataSig = await safeSdk2.signTypedData(messageHash)

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

    itif(safeVersionDeployed >= '1.3.0')('should revert when message is not signed', async () => {
      const { safeSdk1 } = await setupTests()

      const response = await safeSdk1.isValidSignature(await safeSdk1.getHash(MESSAGE), '0x')

      chai.expect(response).to.be.false
    })

    itif(safeVersionDeployed >= '1.3.0')(
      'should generate the correct safeMessageHash',
      async () => {
        const { safe, safeSdk1 } = await setupTests()

        const chainId = await safeSdk1.getChainId()
        const messageHash = await safeSdk1.getHash(MESSAGE)
        const safeMessageHash = await safeSdk1.getSafeMessageHash(messageHash)

        chai
          .expect(safeMessageHash)
          .to.be.eq(calculateSafeMessageHash(safe.address, messageHash, chainId))
      }
    )

    it('should allow use to sign transactions using Safe Accounts (threshold = 1)', async () => {
      const { safe, accounts, safeSdk1, safeSdk2, safeSdk3, signerSafe } = await setupTests()

      const [account1] = accounts

      await account1.signer.sendTransaction({
        to: safe.address,
        value: 1_000_000_000_000_000_000n // 1 ETH // 1 ETH
      })

      const balanceBefore = await safeSdk1.getBalance()
      console.log('BALANCE BEFORE: ', balanceBefore.toString())

      const safeTransactionData: SafeTransactionDataPartial = {
        to: account1.address,
        value: '100000000000000000', // 0.01 ETH
        data: '0x'
      }

      const tx = await safeSdk1.createTransaction({ safeTransactionData })
      const txHash = await safeSdk1.getHash(tx)

      const signature1 = await safeSdk1.signHash(await safeSdk1.getSafeMessageHash(txHash))
      const signature2 = await safeSdk3.signHash(
        await safeSdk3.getSafeMessageHash(
          preimageSafeTransactionHash(signerSafe.address, tx, await safeSdk3.getChainId())
        ),
        true
      )

      console.log('OWNER 1: ', signature1.signer)
      console.log('OWNER 2: ', signature2.signer)

      // const isValidSignature = await safeSdk1.isValidSignature(txHash, [signature1, signature2])
      // console.log('IS VALID SIGNATURE: ', isValidSignature)
      // chai.expect(isValidSignature).to.be.true

      // TODO: This is failing because the owner is invalid
      tx.addSignature(signature1)
      tx.addSignature(signature2)
      console.log(signature1, signature2)
      console.log('signature: ', buildSignature([signature1, signature2]))

      const execResponse = await safeSdk1.executeTransaction(tx, { gasLimit: 1000000 })

      const receipt = await waitSafeTxReceipt(execResponse)
      const balanceAfter = await safeSdk1.getBalance()

      console.log('BALANCE AFTER: ', balanceAfter.toString())
      console.log('RECEIPT:', receipt)
      chai.expect(tx.signatures.size).to.be.eq(2)
      chai.expect(receipt?.status).to.be.eq(1)

      // TODO: This is failing because the owner is invalid
      // const signedTx = await safeSdk1.signTransaction(tx)
      // const signedTx2 = await safeSdk3.signTransaction(signedTx, 'eth_signTypedData_v4', true)

      // const execResponse = await safeSdk1.executeTransaction(signedTx2, { gasLimit: 1000000 })

      // const receipt = await waitSafeTxReceipt(execResponse)
      // const balanceAfter = await safeSdk1.getBalance()

      // console.log('BALANCE AFTER: ', balanceAfter.toString())
      // console.log('RECEIPT:', receipt)
      // chai.expect(tx.signatures.size).to.be.eq(2)
      // chai.expect(receipt?.status).to.be.eq(1)
    })
  })
})
