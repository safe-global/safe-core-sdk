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
import { soliditySha3, utf8ToHex } from 'web3-utils'
import { itif } from './utils/helpers'
import { ethers } from 'ethers'

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
  return soliditySha3(utf8ToHex(message)) || ''
}

export const EIP712_SAFE_MESSAGE_TYPE = {
  // "SafeMessage(bytes message)"
  SafeMessage: [{ type: 'bytes', name: 'message' }]
}

const MESSAGE = 'I am the owner of this Safe account'

describe.only('Using a 2/3 Safe in the context of the EIP1271', async () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks = await getContractNetworks(chainId)

    return {
      safe: await getSafeWithOwners(
        [accounts[0].address, accounts[1].address, accounts[2].address],
        2
      ),
      accounts,
      contractNetworks,
      chainId
    }
  })

  itif(safeVersionDeployed >= '1.3.0')('should validate on-chain messages', async () => {
    const { accounts, contractNetworks, safe } = await setupTests()
    const [account1, account2] = accounts

    const ethAdapter1 = await getEthAdapter(account1.signer)
    const safeSdk1 = await Safe.create({
      ethAdapter: ethAdapter1,
      safeAddress: safe.address,
      contractNetworks
    })

    const ethAdapter2 = await getEthAdapter(account2.signer)
    const safeSdk2 = await Safe.create({
      ethAdapter: ethAdapter2,
      safeAddress: safe.address,
      contractNetworks
    })

    const chainId: number = await safeSdk1.getChainId()

    const customContract = contractNetworks[chainId]

    const signMessageLibContract = await ethAdapter1.getSignMessageLibContract({
      safeVersion: await safeSdk1.getContractVersion(),
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

    const validatedResponse1 = await safeSdk1.signatures.isValidSignature(hashMessage(MESSAGE))
    chai.expect(validatedResponse1).to.be.true

    const validatedResponse2 = await safeSdk1.signatures.isValidSignature(
      hashMessage(MESSAGE),
      '0x'
    )
    chai.expect(validatedResponse2).to.be.true
  })

  itif(safeVersionDeployed >= '1.3.0')('should validate off-chain messages', async () => {
    const { accounts, contractNetworks, safe } = await setupTests()
    const [account1, account2] = accounts
    const ethAdapter = await getEthAdapter(account1.signer)
    const ethAdapter2 = await getEthAdapter(account2.signer)

    const safeSdk1 = await Safe.create({
      ethAdapter: ethAdapter,
      safeAddress: safe.address,
      contractNetworks
    })

    const safeSdk2 = await Safe.create({
      ethAdapter: ethAdapter2,
      safeAddress: safe.address,
      contractNetworks
    })

    // Hash the message
    const messageHash = hashMessage(MESSAGE)
    // Get the Safe message hash of the hashed message
    const safeMessageHash = await safeSdk1.signatures.getMessageHash(messageHash)

    // Sign the Safe message hash with the owners
    const ethSignSig1 = await safeSdk1.signatures.signEIP191Message(safeMessageHash)
    const ethSignSig2 = await safeSdk2.signatures.signEIP191Message(safeMessageHash)

    console.log(
      'PARSE SIGNATURES: ',
      safeSdk1.signatures.parseSignature(
        safeSdk1.signatures.buildSignature([ethSignSig1, ethSignSig2]),
        safeMessageHash
      )
    )

    // Validate the signature sending the Safe message hash and the concatenated signatures
    const isValid1 = await safeSdk1.signatures.isValidSignature(
      messageHash,
      safeSdk1.signatures.buildSignature([ethSignSig1, ethSignSig2])
    )

    chai.expect(isValid1).to.be.true

    // Validate the signature sending the Safe message hash and the array of SafeSignature
    const isValid2 = await safeSdk1.signatures.isValidSignature(messageHash, [
      ethSignSig1,
      ethSignSig2
    ])

    chai.expect(isValid2).to.be.true

    // Validate the signature is not valid when not enough signers has signed
    const isValid3 = await safeSdk1.signatures.isValidSignature(messageHash, [ethSignSig1])

    chai.expect(isValid3).to.be.false
  })

  itif(safeVersionDeployed >= '1.3.0')(
    'should allow to validate a mix EIP191 and EIP712 signatures',
    async () => {
      const { accounts, contractNetworks, safe } = await setupTests()
      const [account1, _, account2] = accounts // Use the third signer to sign the EIP712 message
      const ethAdapter = await getEthAdapter(account1.signer)
      const ethAdapter2 = await getEthAdapter(account2.signer)

      const safeSdk1 = await Safe.create({
        ethAdapter: ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })

      const safeSdk2 = await Safe.create({
        ethAdapter: ethAdapter2,
        safeAddress: safe.address,
        contractNetworks
      })

      // Hash the message
      const messageHash = hashMessage(MESSAGE)
      // Get the Safe message hash of the hashed message
      const safeMessageHash = await safeSdk1.signatures.getMessageHash(messageHash)

      // Sign the Safe message hash with the owners
      const ethSignSig1 = await safeSdk1.signatures.signEIP191Message(safeMessageHash)
      const ethSignSig2 = await safeSdk2.signatures.signEIP712Message()

      console.log(
        'PARSE SIGNATURES: ',
        safeSdk1.signatures.parseSignature(
          safeSdk1.signatures.buildSignature([ethSignSig1, ethSignSig2]),
          safeMessageHash
        )
      )

      // Validate the signature sending the Safe message hash and the concatenated signatures
      const isValid1 = await safeSdk1.signatures.isValidSignature(
        messageHash,
        safeSdk1.signatures.buildSignature([ethSignSig1, ethSignSig2])
      )

      chai.expect(isValid1).to.be.true

      // Validate the signature sending the Safe message hash and the array of SafeSignature
      const isValid2 = await safeSdk1.signatures.isValidSignature(messageHash, [
        ethSignSig1,
        ethSignSig2
      ])

      chai.expect(isValid2).to.be.true

      // Validate the signature is not valid when not enough signers has signed
      const isValid3 = await safeSdk1.signatures.isValidSignature(messageHash, [ethSignSig1])

      chai.expect(isValid3).to.be.false
    }
  )

  itif(safeVersionDeployed >= '1.3.0')('should revert when message is not signed', async () => {
    const { accounts, contractNetworks } = await setupTests()
    const [account1] = accounts
    const safe = await getSafeWithOwners([account1.address])
    const ethAdapter1 = await getEthAdapter(account1.signer)
    const safeSdk1 = await Safe.create({
      ethAdapter: ethAdapter1,
      safeAddress: safe.address,
      contractNetworks
    })

    const response = await safeSdk1.signatures.isValidSignature(hashMessage(MESSAGE), '0x')

    chai.expect(response).to.be.false
  })

  itif(safeVersionDeployed >= '1.3.0')('should generate the correct safeMessageHash', async () => {
    const { safe, accounts, contractNetworks } = await setupTests()
    const [account1] = accounts
    const ethAdapter = await getEthAdapter(account1.signer)
    const safeSdk = await Safe.create({
      ethAdapter: ethAdapter,
      safeAddress: safe.address,
      contractNetworks
    })

    const chainId = await safeSdk.getChainId()
    const safeMessageHash = await safeSdk.signatures.getMessageHash(hashMessage(MESSAGE))

    chai
      .expect(safeMessageHash)
      .to.be.eq(calculateSafeMessageHash(safe.address, hashMessage(MESSAGE), chainId))
  })
})
