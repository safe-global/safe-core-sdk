import Safe, {
  EthSafeSignature,
  getCompatibilityFallbackHandlerContract
} from '@safe-global/protocol-kit/index'
import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import {
  OperationType,
  SafeSignature,
  SafeTransactionDataPartial
} from '@safe-global/safe-core-sdk-types'
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
import { ethers, Signer } from 'ethers'

chai.use(chaiAsPromised)

const hashMessage = (message: string): string => {
  return soliditySha3(utf8ToHex(message)) || ''
}

const buildSignatureBytes = (signatures: SafeSignature[]): string => {
  signatures.sort((left, right) =>
    left.signer.toLowerCase().localeCompare(right.signer.toLowerCase())
  )

  let signatureBytes = '0x'

  for (const sig of signatures) {
    signatureBytes += sig.data.slice(2)
  }

  return signatureBytes
}

export const EIP712_SAFE_MESSAGE_TYPE = {
  // "SafeMessage(bytes message)"
  SafeMessage: [{ type: 'bytes', name: 'message' }]
}

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

export const signHash = async (signer: Signer, hash: string): Promise<SafeSignature> => {
  const typedDataHash = ethers.utils.arrayify(hash)
  const signerAddress = await signer.getAddress()
  const data = (await signer.signMessage(typedDataHash)).replace(/1b$/, '1f').replace(/1c$/, '20')

  return new EthSafeSignature(signerAddress, data)
}

const MESSAGE = 'testing isValidateSignature!'

describe.only('isValidSignature', async () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks = await getContractNetworks(chainId)

    return {
      safe: await getSafeWithOwners([accounts[0].address, accounts[1].address]),
      accounts,
      contractNetworks,
      chainId
    }
  })

  itif(safeVersionDeployed >= '1.3.0')(
    'should validate signed messages (Safe 2 owners, threshold 2)',
    async () => {
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
      const txResponse = await safeSdk1.executeTransaction(signedTx2)

      await waitSafeTxReceipt(txResponse)

      const txResponse2 = await safeSdk1.isValidSignature(hashMessage(MESSAGE), '0x')

      chai.expect(txResponse2).to.be.true
    }
  )

  itif(safeVersionDeployed >= '1.3.0')('should revert if message is not signed', async () => {
    const { accounts, contractNetworks } = await setupTests()
    const [account1] = accounts
    const safe = await getSafeWithOwners([account1.address])
    const ethAdapter1 = await getEthAdapter(account1.signer)
    const safeSdk1 = await Safe.create({
      ethAdapter: ethAdapter1,
      safeAddress: safe.address,
      contractNetworks
    })

    const response = await safeSdk1.isValidSignature(hashMessage(MESSAGE), '0x')

    chai.expect(response).to.be.false
  })

  itif(safeVersionDeployed >= '1.3.0')(
    'should validate off chain signatures (Safe 2 owners, threshold 2)',
    async () => {
      const { accounts, contractNetworks, chainId, safe } = await setupTests()
      const [account1, account2] = accounts

      const ethAdapter1 = await getEthAdapter(account1.signer)
      const ethAdapter2 = await getEthAdapter(account2.signer)
      const safeSdk = await Safe.create({
        ethAdapter: ethAdapter1,
        safeAddress: safe.address,
        contractNetworks
      })
      const safeVersion = await safeSdk.getContractVersion()

      const compatibilityFallbackHandlerContract = await getCompatibilityFallbackHandlerContract({
        ethAdapter: ethAdapter1,
        safeVersion,
        customContracts: contractNetworks?.[chainId]
      })

      const messageHash = hashMessage('I am the owner of this Safe account')
      const txData = compatibilityFallbackHandlerContract.encode('getMessageHash', [messageHash])

      const safeMessageHash = await ethAdapter1.call({
        from: safe.address,
        to: safe.address,
        data: txData
      })

      console.log('safeMessageHash:', safeMessageHash)

      const ethSignSig1 = await signHash(account1.signer, safeMessageHash)

      console.log('ethSignSig1:', ethSignSig1)

      const ethSignSig2 = await signHash(account2.signer, safeMessageHash)

      console.log('ethSignSig2:', ethSignSig2)

      const isValid = await safeSdk.isValidSignature(
        messageHash,
        buildSignatureBytes([ethSignSig1, ethSignSig2])
      )

      chai.expect(isValid).to.be.true
    }
  )
})
