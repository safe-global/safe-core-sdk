import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import Safe, { PredictedSafeProps, SigningMethod } from '@safe-global/protocol-kit/index'
import { SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments } from 'hardhat'
import { itif } from './utils/helpers'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getSafeWithOwners } from './utils/setupContracts'
import { getEip1193Provider } from './utils/setupProvider'
import { getAccounts } from './utils/setupTestNetwork'

chai.use(chaiAsPromised)

describe('Off-chain signatures', () => {
  const setupTests = deployments.createFixture(async ({ deployments, getChainId }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId = BigInt(await getChainId())
    const contractNetworks = await getContractNetworks(chainId)
    const predictedSafe: PredictedSafeProps = {
      safeAccountConfig: {
        owners: [accounts[0].address],
        threshold: 1
      },
      safeDeploymentConfig: {
        safeVersion: safeVersionDeployed
      }
    }
    const provider = getEip1193Provider()

    return {
      safe: await getSafeWithOwners([accounts[0].address, accounts[1].address]),
      accounts,
      contractNetworks,
      predictedSafe,
      provider
    }
  })

  describe('signHash', async () => {
    it('should sign a transaction hash with the current signer if the Safe is not deployed', async () => {
      const { predictedSafe, contractNetworks, provider } = await setupTests()
      const safeSdk = await Safe.create({
        provider,
        predictedSafe,
        contractNetworks
      })
      const txHash = '0xcbf14050c5fcc9b71d4a3ab874cc728db101d19d4466d56fcdbb805117a28c64'
      const signature = await safeSdk.signHash(txHash)
      chai.expect(signature.staticPart().length).to.be.eq(132)
    })

    it('should sign a transaction hash with the current signer', async () => {
      const { safe, contractNetworks, provider } = await setupTests()
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.create({
        provider,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({ transactions: [safeTransactionData] })
      const txHash = await safeSdk.getTransactionHash(tx)
      const signature = await safeSdk.signHash(txHash)
      chai.expect(signature.staticPart().length).to.be.eq(132)
    })
  })

  describe('signTransaction', async () => {
    itif(safeVersionDeployed < '1.3.0')(
      'should fail to sign a transaction if the Safe with version <v1.3.0 is using predicted config',
      async () => {
        const { safe, predictedSafe, contractNetworks, provider } = await setupTests()
        const safeSdk = await Safe.create({
          provider,
          predictedSafe,
          contractNetworks
        })
        const safeAddress = await safe.getAddress()
        const safeSdkExistingSafe = await Safe.create({
          provider,
          safeAddress,
          contractNetworks
        })
        const safeTransactionData = {
          to: await safeSdkExistingSafe.getAddress(),
          value: '0',
          data: '0x'
        }
        const tx = await safeSdkExistingSafe.createTransaction({
          transactions: [safeTransactionData]
        })
        const signedTx = safeSdk.signTransaction(tx)
        await chai
          .expect(signedTx)
          .to.be.rejectedWith(
            'Account Abstraction functionality is not available for Safes with version lower than v1.3.0'
          )
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should sign a transaction with the current signer if the Safe with version >=v1.3.0 is using predicted config',
      async () => {
        const { safe, predictedSafe, contractNetworks, provider } = await setupTests()
        const safeSdk = await Safe.create({
          provider,
          predictedSafe,
          contractNetworks
        })
        const safeAddress = await safe.getAddress()
        const safeTransactionData = {
          to: safeAddress,
          value: '0',
          data: '0x'
        }
        const tx = await safeSdk.createTransaction({ transactions: [safeTransactionData] })
        chai.expect(tx.signatures.size).to.be.eq(0)
        const signedTx = await safeSdk.signTransaction(tx)
        chai.expect(tx.signatures.size).to.be.eq(0)
        chai.expect(signedTx.signatures.size).to.be.eq(1)
      }
    )

    it('should fail if the signature is added by an account that is not an owner', async () => {
      const { safe, accounts, contractNetworks, provider } = await setupTests()
      const account3 = accounts[2]
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.create({
        provider,
        safeAddress,
        signer: account3.address,
        contractNetworks
      })
      const safeTransactionData = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({ transactions: [safeTransactionData] })
      await chai
        .expect(safeSdk.signTransaction(tx))
        .to.be.rejectedWith('Transactions can only be signed by Safe owners')
    })

    it('should ignore duplicated signatures', async () => {
      const { safe, contractNetworks, provider } = await setupTests()
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.create({
        provider,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({ transactions: [safeTransactionData] })
      chai.expect(tx.signatures.size).to.be.eq(0)
      const signedTx1 = await safeSdk.signTransaction(tx)
      chai.expect(signedTx1.signatures.size).to.be.eq(1)
      const signedTx2 = await safeSdk.signTransaction(signedTx1)
      chai.expect(signedTx2.signatures.size).to.be.eq(1)
      chai.expect(tx.signatures.size).to.be.eq(0)
    })

    itif(safeVersionDeployed === '1.0.0')(
      'should fail if the signature of the current signer is added using eth_sign and safeVersion===1.0.0',
      async () => {
        const { safe, contractNetworks, provider } = await setupTests()
        const safeAddress = await safe.getAddress()
        const safeSdk = await Safe.create({
          provider,
          safeAddress: safeAddress,
          contractNetworks
        })
        const safeTransactionData = {
          to: safeAddress,
          value: '0',
          data: '0x'
        }
        const tx = await safeSdk.createTransaction({ transactions: [safeTransactionData] })
        await chai
          .expect(safeSdk.signTransaction(tx, SigningMethod.ETH_SIGN))
          .to.be.rejectedWith('eth_sign is only supported by Safes >= v1.1.0')
      }
    )

    itif(safeVersionDeployed > '1.0.0')(
      'should add the signature of the current signer using eth_sign if safeVersion>1.0.0',
      async () => {
        const { safe, contractNetworks, provider } = await setupTests()
        const safeAddress = await safe.getAddress()
        const safeSdk = await Safe.create({
          provider,
          safeAddress,
          contractNetworks
        })
        const safeTransactionData = {
          to: safeAddress,
          value: '0',
          data: '0x'
        }
        const tx = await safeSdk.createTransaction({ transactions: [safeTransactionData] })
        chai.expect(tx.signatures.size).to.be.eq(0)
        const signedTx = await safeSdk.signTransaction(tx, SigningMethod.ETH_SIGN)
        chai.expect(tx.signatures.size).to.be.eq(0)
        chai.expect(signedTx.signatures.size).to.be.eq(1)
      }
    )

    it('should add the signature of the current signer using eth_signTypedData', async () => {
      const { safe, contractNetworks, provider } = await setupTests()
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.create({
        provider,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({ transactions: [safeTransactionData] })
      chai.expect(tx.signatures.size).to.be.eq(0)
      const signedTx = await safeSdk.signTransaction(tx, SigningMethod.ETH_SIGN_TYPED_DATA)
      chai.expect(tx.signatures.size).to.be.eq(0)
      chai.expect(signedTx.signatures.size).to.be.eq(1)
    })

    it('should add the signature of the current signer using eth_signTypedData_v3', async () => {
      const { safe, contractNetworks, provider } = await setupTests()
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.create({
        provider,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({ transactions: [safeTransactionData] })
      chai.expect(tx.signatures.size).to.be.eq(0)
      const signedTx = await safeSdk.signTransaction(tx, SigningMethod.ETH_SIGN_TYPED_DATA_V3)
      chai.expect(tx.signatures.size).to.be.eq(0)
      chai.expect(signedTx.signatures.size).to.be.eq(1)
    })

    it('should add the signature of the current signer using eth_signTypedData_v4', async () => {
      const { safe, contractNetworks, provider } = await setupTests()
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.create({
        provider,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({ transactions: [safeTransactionData] })
      chai.expect(tx.signatures.size).to.be.eq(0)
      const signedTx = await safeSdk.signTransaction(tx, SigningMethod.ETH_SIGN_TYPED_DATA_V4)
      chai.expect(tx.signatures.size).to.be.eq(0)
      chai.expect(signedTx.signatures.size).to.be.eq(1)
    })

    it('should add the signature of the current signer using eth_signTypedData_v4 by default', async () => {
      const { safe, contractNetworks, provider } = await setupTests()
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.create({
        provider,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({ transactions: [safeTransactionData] })
      chai.expect(tx.signatures.size).to.be.eq(0)
      const signedTx = await safeSdk.signTransaction(tx)
      chai.expect(tx.signatures.size).to.be.eq(0)
      chai.expect(signedTx.signatures.size).to.be.eq(1)
    })

    it('should sign a transaction received from the Safe Transaction Service', async () => {
      const { safe, accounts, contractNetworks, provider } = await setupTests()
      const [account1, account2] = accounts
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.create({
        provider,
        safeAddress,
        contractNetworks
      })
      const safeServiceTransaction: SafeMultisigTransactionResponse = {
        safe: '',
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x',
        operation: 1,
        gasToken: '0x3333333333333333333333333333333333333333',
        safeTxGas: 666,
        baseGas: 111,
        gasPrice: '222',
        refundReceiver: '0x4444444444444444444444444444444444444444',
        nonce: await safeSdk.getNonce(),
        executionDate: '',
        submissionDate: '',
        modified: '',
        blockNumber: 12345,
        transactionHash: '',
        safeTxHash: '',
        executor: '',
        isExecuted: false,
        isSuccessful: false,
        ethGasPrice: '',
        gasUsed: 12345,
        fee: '12345',
        origin: '',
        dataDecoded: '',
        confirmationsRequired: 2,
        confirmations: [
          {
            owner: '0x1111111111111111111111111111111111111111',
            submissionDate: '',
            transactionHash: '',
            confirmationType: '',
            signature: '0x111111',
            signatureType: ''
          },
          {
            owner: '0x2222222222222222222222222222222222222222',
            submissionDate: '',
            transactionHash: '',
            confirmationType: '',
            signature: '0x222222',
            signatureType: ''
          }
        ],
        trusted: true,
        signatures: '0x111111222222'
      }
      const signedTx = await safeSdk.signTransaction(safeServiceTransaction)
      chai.expect(safeServiceTransaction.confirmations?.length).to.be.eq(2)
      chai.expect(signedTx.signatures.size).to.be.eq(3)
      const signerAddress = account1.address
      const signerSignature = signedTx.signatures.get(signerAddress!.toLowerCase())?.data
      chai
        .expect(signedTx.encodedSignatures())
        .to.be.eq(safeServiceTransaction.signatures! + signerSignature!.slice(2))
    })
  })
})
