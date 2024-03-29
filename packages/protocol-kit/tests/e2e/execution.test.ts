import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import Safe, {
  EthersTransactionOptions,
  SigningMethod,
  Web3TransactionOptions
} from '@safe-global/protocol-kit/index'
import { MetaTransactionData, TransactionOptions } from '@safe-global/safe-core-sdk-types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments } from 'hardhat'
import { itif } from './utils/helpers'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getERC20Mintable, getSafeWithOwners } from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'
import { waitSafeTxReceipt } from './utils/transactions'

chai.use(chaiAsPromised)

describe('Transactions execution', () => {
  const setupTests = deployments.createFixture(async ({ deployments, getChainId }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId = BigInt(await getChainId())
    const contractNetworks = await getContractNetworks(chainId)
    return {
      erc20Mintable: await getERC20Mintable(),
      safe: await getSafeWithOwners([accounts[0].address, accounts[1].address]),
      accounts,
      contractNetworks
    }
  })

  describe('isValidTransaction', async () => {
    it('should return false if a transaction will not be executed successfully', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeAddress = await safe.getAddress()
      const ethAdapter1 = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter: ethAdapter1,
        safeAddress,
        contractNetworks
      })
      const ethAdapter2 = await getEthAdapter(account2.signer)
      const safeSdk2 = await safeSdk1.connect({
        ethAdapter: ethAdapter2,
        contractNetworks
      })
      await account1.signer.sendTransaction({
        to: safeAddress,
        value: 1_000_000_000_000_000_000n // 1 ETH
      })
      const safeInitialBalance = await safeSdk1.getBalance()
      const safeTransactionData = {
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      }
      const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
      const rejectTx = await safeSdk1.createRejectionTransaction(tx.data.nonce)
      const signedRejectTx = await safeSdk1.signTransaction(rejectTx)
      const txRejectResponse = await safeSdk2.executeTransaction(signedRejectTx)
      await waitSafeTxReceipt(txRejectResponse)
      const signedTx = await safeSdk1.signTransaction(tx)
      const isTxExecutable = await safeSdk2.isValidTransaction(signedTx)
      chai.expect(isTxExecutable).to.be.eq(false)
      const safeFinalBalance = await safeSdk1.getBalance()
      chai.expect(safeInitialBalance.toString()).to.be.eq(safeFinalBalance.toString())
    })

    it('should return true if a transaction will execute successfully', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeAddress = await safe.getAddress()
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter,
        safeAddress,
        contractNetworks
      })
      await account1.signer.sendTransaction({
        to: safeAddress,
        value: 1_000_000_000_000_000_000n // 1 ETH
      })
      const safeInitialBalance = await safeSdk1.getBalance()
      const safeTransactionData = {
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      }
      const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
      const isTxExecutable = await safeSdk1.isValidTransaction(tx)
      chai.expect(isTxExecutable).to.be.eq(true)
      const safeFinalBalance = await safeSdk1.getBalance()
      chai.expect(safeInitialBalance.toString()).to.be.eq(safeFinalBalance.toString())
    })
  })

  describe('executeTransaction', async () => {
    it('should fail if there are not enough Ether funds', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeAddress = await safe.getAddress()
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter,
        safeAddress,
        contractNetworks
      })
      const safeInitialBalance = await safeSdk1.getBalance()
      chai.expect(safeInitialBalance.toString()).to.be.eq('0')
      const safeTransactionData = {
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      }
      const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
      await chai
        .expect(safeSdk1.executeTransaction(tx))
        .to.be.rejectedWith('Not enough Ether funds')
    })

    it('should fail if there are not enough signatures (1 missing)', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2, account3] = accounts
      const safe = await getSafeWithOwners([account1.address, account2.address, account3.address])
      const safeAddress = await safe.getAddress()
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter,
        safeAddress,
        contractNetworks
      })
      const ethAdapter2 = await getEthAdapter(account2.signer)
      const safeSdk2 = await safeSdk1.connect({ ethAdapter: ethAdapter2 })
      const safeTransactionData = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
      const signedTx = await safeSdk1.signTransaction(tx)
      const txHash = await safeSdk2.getTransactionHash(tx)
      const txResponse = await safeSdk2.approveTransactionHash(txHash)
      await waitSafeTxReceipt(txResponse)
      await chai
        .expect(safeSdk2.executeTransaction(signedTx))
        .to.be.rejectedWith('There is 1 signature missing')
    })

    it('should fail if there are not enough signatures (>1 missing)', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2, account3] = accounts
      const safe = await getSafeWithOwners([account1.address, account2.address, account3.address])
      const safeAddress = await safe.getAddress()
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
      await chai
        .expect(safeSdk1.executeTransaction(tx))
        .to.be.rejectedWith('There are 2 signatures missing')
    })

    it('should fail if the user tries to execute a transaction that was rejected', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeAddress = await safe.getAddress()
      const ethAdapter1 = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter: ethAdapter1,
        safeAddress,
        contractNetworks
      })
      const ethAdapter2 = await getEthAdapter(account2.signer)
      const safeSdk2 = await safeSdk1.connect({
        ethAdapter: ethAdapter2,
        contractNetworks
      })
      await account1.signer.sendTransaction({
        to: safeAddress,
        value: 1_000_000_000_000_000_000n // 1 ETH
      })
      const safeTransactionData = {
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      }
      const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
      const rejectTx = await safeSdk1.createRejectionTransaction(tx.data.nonce)
      const signedRejectTx = await safeSdk1.signTransaction(rejectTx)
      const txRejectResponse = await safeSdk2.executeTransaction(signedRejectTx)
      await waitSafeTxReceipt(txRejectResponse)
      const signedTx = await safeSdk1.signTransaction(tx)
      await chai
        .expect(safeSdk2.executeTransaction(signedTx))
        .to.be.rejectedWith(safeVersionDeployed >= '1.3.0' ? 'GS026' : 'Invalid owner provided')
    })

    it('should fail if a user tries to execute a transaction with options: { gas, gasLimit }', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeAddress = await safe.getAddress()
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter,
        safeAddress,
        contractNetworks
      })
      await account1.signer.sendTransaction({
        to: safeAddress,
        value: 1_000_000_000_000_000_000n // 1 ETH
      })
      const safeTransactionData = {
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      }
      const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
      const options: TransactionOptions = { gas: 123456, gasLimit: 123456 }
      await chai
        .expect(safeSdk1.executeTransaction(tx, options))
        .to.be.rejectedWith('Cannot specify gas and gasLimit together in transaction options')
    })

    it('should fail if a user tries to execute a transaction with options: { nonce: <invalid_nonce> }', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeAddress = await safe.getAddress()
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter,
        safeAddress,
        contractNetworks
      })
      await account1.signer.sendTransaction({
        to: safeAddress,
        value: 1_000_000_000_000_000_000n // 1 ETH
      })
      const safeTransactionData = {
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      }
      const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
      const execOptions: EthersTransactionOptions = { nonce: 123456789 }
      await chai
        .expect(safeSdk1.executeTransaction(tx, execOptions))
        .to.be.rejectedWith('Nonce too high')
    })

    it('should execute a transaction with threshold 1', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeAddress = await safe.getAddress()
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter,
        safeAddress,
        contractNetworks
      })
      await account1.signer.sendTransaction({
        to: safeAddress,
        value: 1_000_000_000_000_000_000n // 1 ETH
      })
      const safeInitialBalance = await safeSdk1.getBalance()
      const safeTransactionData = {
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      }
      const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
      const initNumSignatures = tx.signatures.size
      const txResponse = await safeSdk1.executeTransaction(tx)
      const finalNumSignatures = tx.signatures.size
      chai.expect(initNumSignatures).to.be.eq(finalNumSignatures)
      await waitSafeTxReceipt(txResponse)
      const safeFinalBalance = await safeSdk1.getBalance()
      chai.expect(safeInitialBalance).to.be.eq(safeFinalBalance + BigInt(tx.data.value))
    })

    itif(process.env.ETH_LIB === 'web3' && safeVersionDeployed === '1.0.0')(
      'should execute a transaction with threshold >1 and all different kind of signatures with web3 provider and safeVersion===1.0.0',
      async () => {
        const { accounts, contractNetworks } = await setupTests()
        const [account1, account2, account3] = accounts
        const safe = await getSafeWithOwners([account1.address, account2.address, account3.address])
        const safeAddress = await safe.getAddress()
        await account1.signer.sendTransaction({
          to: safeAddress,
          value: 1_000_000_000_000_000_000n // 1 ETH
        })
        const ethAdapter1 = await getEthAdapter(account1.signer)
        const ethAdapter2 = await getEthAdapter(account2.signer)
        const ethAdapter3 = await getEthAdapter(account3.signer)
        const safeSdk1 = await Safe.create({
          ethAdapter: ethAdapter1,
          safeAddress,
          contractNetworks
        })
        const safeSdk2 = await safeSdk1.connect({ ethAdapter: ethAdapter2 })
        const safeSdk3 = await safeSdk1.connect({ ethAdapter: ethAdapter3 })
        const safeInitialBalance = await safeSdk1.getBalance()
        const safeTransactionData = {
          to: account2.address,
          value: '500000000000000000', // 0.5 ETH
          data: '0x'
        }
        const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })

        // Signature: on-chain
        const txHash = await safeSdk1.getTransactionHash(tx)
        const txResponse1 = await safeSdk1.approveTransactionHash(txHash)
        await waitSafeTxReceipt(txResponse1)

        // Signature: default (eth_signTypedData_v4)
        let signedTx = await safeSdk2.signTransaction(tx)

        // Signature: eth_signTypedData_v4
        signedTx = await safeSdk3.signTransaction(signedTx, SigningMethod.ETH_SIGN_TYPED_DATA_V4)

        const txResponse2 = await safeSdk1.executeTransaction(signedTx)
        await waitSafeTxReceipt(txResponse2)
        const safeFinalBalance = await safeSdk1.getBalance()
        chai.expect(safeInitialBalance).to.be.eq(safeFinalBalance + BigInt(tx.data.value))
      }
    )

    itif(process.env.ETH_LIB === 'web3' && safeVersionDeployed > '1.0.0')(
      'should execute a transaction with threshold >1 and all different kind of signatures with web3 provider and safeVersion>1.0.0',
      async () => {
        const { accounts, contractNetworks } = await setupTests()
        const [account1, account2, account3, account4] = accounts
        const safe = await getSafeWithOwners([
          account1.address,
          account2.address,
          account3.address,
          account4.address
        ])
        const safeAddress = await safe.getAddress()
        await account1.signer.sendTransaction({
          to: safeAddress,
          value: 1_000_000_000_000_000_000n // 1 ETH
        })
        const ethAdapter1 = await getEthAdapter(account1.signer)
        const ethAdapter2 = await getEthAdapter(account2.signer)
        const ethAdapter3 = await getEthAdapter(account3.signer)
        const ethAdapter4 = await getEthAdapter(account4.signer)
        const safeSdk1 = await Safe.create({
          ethAdapter: ethAdapter1,
          safeAddress,
          contractNetworks
        })
        const safeSdk2 = await safeSdk1.connect({ ethAdapter: ethAdapter2 })
        const safeSdk3 = await safeSdk1.connect({ ethAdapter: ethAdapter3 })
        const safeSdk4 = await safeSdk1.connect({ ethAdapter: ethAdapter4 })
        const safeInitialBalance = await safeSdk1.getBalance()
        const safeTransactionData = {
          to: account2.address,
          value: '500000000000000000', // 0.5 ETH
          data: '0x'
        }
        const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })

        // Signature: on-chain
        const txHash = await safeSdk1.getTransactionHash(tx)
        const txResponse1 = await safeSdk1.approveTransactionHash(txHash)
        await waitSafeTxReceipt(txResponse1)

        // Signature: default (eth_signTypedData_v4)
        let signedTx = await safeSdk2.signTransaction(tx)

        // Signature: eth_signTypedData_v4
        signedTx = await safeSdk3.signTransaction(signedTx, SigningMethod.ETH_SIGN_TYPED_DATA_V4)

        // Signature: eth_sign
        signedTx = await safeSdk4.signTransaction(signedTx, SigningMethod.ETH_SIGN)

        const txResponse2 = await safeSdk1.executeTransaction(signedTx)
        await waitSafeTxReceipt(txResponse2)
        const safeFinalBalance = await safeSdk1.getBalance()
        chai.expect(safeInitialBalance).to.be.eq(safeFinalBalance + BigInt(tx.data.value))
      }
    )

    itif(process.env.ETH_LIB === 'ethers' && safeVersionDeployed === '1.0.0')(
      'should execute a transaction with threshold >1 and all different kind of signatures with ethers provider and safeVersion===1.0.0',
      async () => {
        const { accounts, contractNetworks } = await setupTests()
        const [account1, account2, account3, account4, account5] = accounts
        const safe = await getSafeWithOwners([
          account1.address,
          account2.address,
          account3.address,
          account4.address,
          account5.address
        ])
        const safeAddress = await safe.getAddress()
        await account1.signer.sendTransaction({
          to: safeAddress,
          value: 1_000_000_000_000_000_000n // 1 ETH
        })
        const ethAdapter1 = await getEthAdapter(account1.signer)
        const ethAdapter2 = await getEthAdapter(account2.signer)
        const ethAdapter3 = await getEthAdapter(account3.signer)
        const ethAdapter4 = await getEthAdapter(account4.signer)
        const ethAdapter5 = await getEthAdapter(account5.signer)
        const safeSdk1 = await Safe.create({
          ethAdapter: ethAdapter1,
          safeAddress,
          contractNetworks
        })
        const safeSdk2 = await safeSdk1.connect({ ethAdapter: ethAdapter2 })
        const safeSdk3 = await safeSdk1.connect({ ethAdapter: ethAdapter3 })
        const safeSdk4 = await safeSdk1.connect({ ethAdapter: ethAdapter4 })
        const safeSdk5 = await safeSdk1.connect({ ethAdapter: ethAdapter5 })
        const safeInitialBalance = await safeSdk1.getBalance()
        const safeTransactionData = {
          to: account2.address,
          value: '500000000000000000', // 0.5 ETH
          data: '0x'
        }
        const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })

        // Signature: on-chain
        const txHash = await safeSdk1.getTransactionHash(tx)
        const txResponse1 = await safeSdk1.approveTransactionHash(txHash)
        await waitSafeTxReceipt(txResponse1)

        // Signature: default (eth_signTypedData_v4)
        let signedTx = await safeSdk2.signTransaction(tx)

        // Signature: eth_signTypedData
        signedTx = await safeSdk3.signTransaction(signedTx, SigningMethod.ETH_SIGN_TYPED_DATA)

        // Signature: eth_signTypedData_v3
        signedTx = await safeSdk4.signTransaction(signedTx, SigningMethod.ETH_SIGN_TYPED_DATA_V3)

        // Signature: eth_signTypedData_v4
        signedTx = await safeSdk5.signTransaction(signedTx, SigningMethod.ETH_SIGN_TYPED_DATA_V4)

        const txResponse2 = await safeSdk1.executeTransaction(signedTx)
        await waitSafeTxReceipt(txResponse2)
        const safeFinalBalance = await safeSdk1.getBalance()
        chai.expect(safeInitialBalance).to.be.eq(safeFinalBalance + BigInt(tx.data.value))
      }
    )

    itif(process.env.ETH_LIB === 'ethers' && safeVersionDeployed > '1.0.0')(
      'should execute a transaction with threshold >1 and all different kind of signatures with ethers provider and safeVersion>1.0.0',
      async () => {
        const { accounts, contractNetworks } = await setupTests()
        const [account1, account2, account3, account4, account5, account6] = accounts
        const safe = await getSafeWithOwners([
          account1.address,
          account2.address,
          account3.address,
          account4.address,
          account5.address,
          account6.address
        ])
        const safeAddress = await safe.getAddress()
        await account1.signer.sendTransaction({
          to: safeAddress,
          value: 1_000_000_000_000_000_000n // 1 ETH
        })
        const ethAdapter1 = await getEthAdapter(account1.signer)
        const ethAdapter2 = await getEthAdapter(account2.signer)
        const ethAdapter3 = await getEthAdapter(account3.signer)
        const ethAdapter4 = await getEthAdapter(account4.signer)
        const ethAdapter5 = await getEthAdapter(account5.signer)
        const ethAdapter6 = await getEthAdapter(account6.signer)
        const safeSdk1 = await Safe.create({
          ethAdapter: ethAdapter1,
          safeAddress,
          contractNetworks
        })
        const safeSdk2 = await safeSdk1.connect({ ethAdapter: ethAdapter2 })
        const safeSdk3 = await safeSdk1.connect({ ethAdapter: ethAdapter3 })
        const safeSdk4 = await safeSdk1.connect({ ethAdapter: ethAdapter4 })
        const safeSdk5 = await safeSdk1.connect({ ethAdapter: ethAdapter5 })
        const safeSdk6 = await safeSdk1.connect({ ethAdapter: ethAdapter6 })
        const safeInitialBalance = await safeSdk1.getBalance()
        const safeTransactionData = {
          to: account2.address,
          value: '500000000000000000', // 0.5 ETH
          data: '0x'
        }
        const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })

        // Signature: on-chain
        const txHash = await safeSdk1.getTransactionHash(tx)
        const txResponse1 = await safeSdk1.approveTransactionHash(txHash)
        await waitSafeTxReceipt(txResponse1)

        // Signature: default (eth_signTypedData_v4)
        let signedTx = await safeSdk2.signTransaction(tx)

        // Signature: eth_signTypedData
        signedTx = await safeSdk3.signTransaction(signedTx, SigningMethod.ETH_SIGN_TYPED_DATA)

        // Signature: eth_signTypedData_v3
        signedTx = await safeSdk4.signTransaction(signedTx, SigningMethod.ETH_SIGN_TYPED_DATA_V3)

        // Signature: eth_signTypedData_v4
        signedTx = await safeSdk5.signTransaction(signedTx, SigningMethod.ETH_SIGN_TYPED_DATA_V4)

        // Signature: eth_sign
        signedTx = await safeSdk6.signTransaction(signedTx, SigningMethod.ETH_SIGN)

        const txResponse2 = await safeSdk1.executeTransaction(signedTx)
        await waitSafeTxReceipt(txResponse2)
        const safeFinalBalance = await safeSdk1.getBalance()
        chai.expect(safeInitialBalance).to.be.eq(safeFinalBalance + BigInt(tx.data.value))
      }
    )

    it('should execute a transaction when is not submitted by an owner', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1, account2, account3] = accounts
      const ethAdapter1 = await getEthAdapter(account1.signer)
      const safeAddress = await safe.getAddress()
      const safeSdk1 = await Safe.create({
        ethAdapter: ethAdapter1,
        safeAddress,
        contractNetworks
      })
      const ethAdapter2 = await getEthAdapter(account2.signer)
      const safeSdk2 = await safeSdk1.connect({ ethAdapter: ethAdapter2 })
      const ethAdapter3 = await getEthAdapter(account3.signer)
      const safeSdk3 = await safeSdk1.connect({ ethAdapter: ethAdapter3 })
      await account2.signer.sendTransaction({
        to: safeAddress,
        value: 1_000_000_000_000_000_000n // 1 ETH
      })
      const safeInitialBalance = await safeSdk1.getBalance()
      const safeTransactionData = {
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      }
      const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
      const signedTx = await safeSdk1.signTransaction(tx)
      const txHash = await safeSdk2.getTransactionHash(tx)
      const txResponse1 = await safeSdk2.approveTransactionHash(txHash)
      await waitSafeTxReceipt(txResponse1)
      const txResponse2 = await safeSdk3.executeTransaction(signedTx)
      await waitSafeTxReceipt(txResponse2)
      const safeFinalBalance = await safeSdk1.getBalance()
      chai.expect(safeInitialBalance).to.be.eq(safeFinalBalance + BigInt(tx.data.value))
    })

    itif(process.env.ETH_LIB === 'ethers')(
      'should execute a transaction with options: { gasLimit }',
      async () => {
        const { accounts, contractNetworks } = await setupTests()
        const [account1, account2] = accounts
        const safe = await getSafeWithOwners([account1.address])
        const safeAddress = await safe.getAddress()
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk1 = await Safe.create({
          ethAdapter,
          safeAddress,
          contractNetworks
        })
        await account1.signer.sendTransaction({
          to: safeAddress,
          value: 1_000_000_000_000_000_000n // 1 ETH
        })
        const safeTransactionData = {
          to: account2.address,
          value: '500000000000000000', // 0.5 ETH
          data: '0x'
        }
        const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
        const execOptions: EthersTransactionOptions = { gasLimit: 123456 }
        const txResponse = await safeSdk1.executeTransaction(tx, execOptions)
        await waitSafeTxReceipt(txResponse)
        const txConfirmed = await ethAdapter.getTransaction(txResponse.hash)
        chai.expect(execOptions.gasLimit).to.be.eq(Number(txConfirmed.gasLimit))
      }
    )

    itif(process.env.ETH_LIB === 'ethers')(
      'should execute a transaction with options: { gasLimit, gasPrice }',
      async () => {
        const { accounts, contractNetworks } = await setupTests()
        const [account1, account2] = accounts
        const safe = await getSafeWithOwners([account1.address])
        const safeAddress = await safe.getAddress()
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk1 = await Safe.create({
          ethAdapter,
          safeAddress,
          contractNetworks
        })
        await account1.signer.sendTransaction({
          to: safeAddress,
          value: 1_000_000_000_000_000_000n // 1 ETH
        })
        const safeTransactionData = {
          to: account2.address,
          value: '500000000000000000', // 0.5 ETH
          data: '0x'
        }
        const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
        const execOptions: EthersTransactionOptions = {
          gasLimit: 123456,
          gasPrice: 170000000
        }
        const txResponse = await safeSdk1.executeTransaction(tx, execOptions)
        await waitSafeTxReceipt(txResponse)
        const txConfirmed = await ethAdapter.getTransaction(txResponse.hash)
        chai.expect(execOptions.gasPrice).to.be.eq(Number(txConfirmed.gasPrice))
        chai.expect(execOptions.gasLimit).to.be.eq(Number(txConfirmed.gasLimit))
      }
    )

    itif(process.env.ETH_LIB === 'ethers')(
      'should execute a transaction with options: { maxFeePerGas, maxPriorityFeePerGas }',
      async () => {
        const { accounts, contractNetworks } = await setupTests()
        const [account1, account2] = accounts
        const safe = await getSafeWithOwners([account1.address])
        const safeAddress = await safe.getAddress()
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk1 = await Safe.create({
          ethAdapter,
          safeAddress,
          contractNetworks
        })
        await account1.signer.sendTransaction({
          to: safeAddress,
          value: 1_000_000_000_000_000_000n // 1 ETH
        })
        const safeTransactionData = {
          to: account2.address,
          value: '500000000000000000', // 0.5 ETH
          data: '0x'
        }
        const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
        const execOptions = {
          maxFeePerGas: 200_000_000, //higher than hardhat's block baseFeePerGas
          maxPriorityFeePerGas: 1
        }
        const txResponse = await safeSdk1.executeTransaction(tx, execOptions)
        await waitSafeTxReceipt(txResponse)
        const txConfirmed = await ethAdapter.getTransaction(txResponse.hash)
        chai.expect(BigInt(execOptions.maxFeePerGas)).to.be.eq(txConfirmed.maxFeePerGas)
        chai
          .expect(BigInt(execOptions.maxPriorityFeePerGas))
          .to.be.eq(txConfirmed.maxPriorityFeePerGas)
      }
    )

    itif(process.env.ETH_LIB === 'web3')(
      'should execute a transaction with options: { gas }',
      async () => {
        const { accounts, contractNetworks } = await setupTests()
        const [account1, account2] = accounts
        const safe = await getSafeWithOwners([account1.address])
        const safeAddress = await safe.getAddress()
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk1 = await Safe.create({
          ethAdapter,
          safeAddress,
          contractNetworks
        })
        await account1.signer.sendTransaction({
          to: safeAddress,
          value: 1_000_000_000_000_000_000n // 1 ETH
        })
        const safeTransactionData = {
          to: account2.address,
          value: '500000000000000000', // 0.5 ETH
          data: '0x'
        }
        const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
        const execOptions: Web3TransactionOptions = { gas: 123456 }
        const txResponse = await safeSdk1.executeTransaction(tx, execOptions)
        await waitSafeTxReceipt(txResponse)
        const txConfirmed = await ethAdapter.getTransaction(txResponse.hash)
        chai.expect(execOptions.gas).to.be.eq(txConfirmed.gas)
      }
    )

    itif(process.env.ETH_LIB === 'web3')(
      'should execute a transaction with options: { gas, gasPrice }',
      async () => {
        const { accounts, contractNetworks } = await setupTests()
        const [account1, account2] = accounts
        const safe = await getSafeWithOwners([account1.address])
        const safeAddress = await safe.getAddress()
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk1 = await Safe.create({
          ethAdapter,
          safeAddress,
          contractNetworks
        })
        await account1.signer.sendTransaction({
          to: safeAddress,
          value: 1_000_000_000_000_000_000n // 1 ETH
        })
        const safeTransactionData = {
          to: account2.address,
          value: '500000000000000000', // 0.5 ETH
          data: '0x'
        }
        const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
        const execOptions: Web3TransactionOptions = {
          gas: 123456,
          gasPrice: 170000000
        }
        const txResponse = await safeSdk1.executeTransaction(tx, execOptions)
        await waitSafeTxReceipt(txResponse)
        const txConfirmed = await ethAdapter.getTransaction(txResponse.hash)
        chai.expect(execOptions.gasPrice).to.be.eq(Number(txConfirmed.gasPrice))
        chai.expect(execOptions.gas).to.be.eq(txConfirmed.gas)
      }
    )

    itif(process.env.ETH_LIB === 'web3')(
      'should execute a transaction with options: { maxFeePerGas, maxPriorityFeePerGas }',
      async () => {
        const { accounts, contractNetworks } = await setupTests()
        const [account1, account2] = accounts
        const safe = await getSafeWithOwners([account1.address])
        const safeAddress = await safe.getAddress()
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk1 = await Safe.create({
          ethAdapter,
          safeAddress,
          contractNetworks
        })
        await account1.signer.sendTransaction({
          to: safeAddress,
          value: 1_000_000_000_000_000_000n // 1 ETH
        })
        const safeTransactionData = {
          to: account2.address,
          value: '500000000000000000', // 0.5 ETH
          data: '0x'
        }
        const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
        const execOptions = {
          maxFeePerGas: 200000000, //higher than hardhat's block baseFeePerGas
          maxPriorityFeePerGas: 1
        }
        const txResponse = await safeSdk1.executeTransaction(tx, execOptions)
        await waitSafeTxReceipt(txResponse)
        const txConfirmed = await ethAdapter.getTransaction(txResponse.hash)
        chai.expect(BigInt(execOptions.maxFeePerGas)).to.be.eq(BigInt(txConfirmed.maxFeePerGas))
        chai
          .expect(BigInt(execOptions.maxPriorityFeePerGas))
          .to.be.eq(BigInt(txConfirmed.maxPriorityFeePerGas))
      }
    )

    it('should execute a transaction with options: { nonce }', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeAddress = await safe.getAddress()
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter,
        safeAddress,
        contractNetworks
      })
      await account1.signer.sendTransaction({
        to: safeAddress,
        value: 1_000_000_000_000_000_000n // 1 ETH
      })
      const safeTransactionData = {
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      }
      const currentNonce = await ethAdapter.getNonce(account1.address, 'pending')
      const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
      const execOptions: EthersTransactionOptions = { nonce: currentNonce }
      const txResponse = await safeSdk1.executeTransaction(tx, execOptions)
      await waitSafeTxReceipt(txResponse)
      const txConfirmed = await ethAdapter.getTransaction(txResponse.hash)
      chai.expect(execOptions.nonce).to.be.eq(txConfirmed.nonce)
    })
  })

  describe('executeTransaction (MultiSend)', async () => {
    it('should execute a batch transaction with threshold >1', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2, account3] = accounts
      const safe = await getSafeWithOwners([account1.address, account2.address, account3.address])
      const safeAddress = await safe.getAddress()
      const ethAdapter1 = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter: ethAdapter1,
        safeAddress,
        contractNetworks
      })
      const ethAdapter2 = await getEthAdapter(account2.signer)
      const safeSdk2 = await safeSdk1.connect({ ethAdapter: ethAdapter2 })
      const ethAdapter3 = await getEthAdapter(account3.signer)
      const safeSdk3 = await safeSdk1.connect({ ethAdapter: ethAdapter3 })
      await account1.signer.sendTransaction({
        to: safeAddress,
        value: 2_000_000_000_000_000_000n // 2 ETH
      })
      const safeInitialBalance = await safeSdk1.getBalance()
      const transactions: MetaTransactionData[] = [
        {
          to: account2.address,
          value: '1100000000000000000', // 1.1 ETH
          data: '0x'
        },
        {
          to: account2.address,
          value: '100000000000000000', // 0.1 ETH
          data: '0x'
        }
      ]
      const multiSendTx = await safeSdk1.createTransaction({ transactions })
      const signedMultiSendTx = await safeSdk1.signTransaction(multiSendTx)
      const txHash = await safeSdk2.getTransactionHash(multiSendTx)
      const txResponse1 = await safeSdk2.approveTransactionHash(txHash)
      await waitSafeTxReceipt(txResponse1)
      const txResponse2 = await safeSdk3.executeTransaction(signedMultiSendTx)
      await waitSafeTxReceipt(txResponse2)
      const safeFinalBalance = await safeSdk1.getBalance()
      chai
        .expect(safeInitialBalance)
        .to.be.eq(safeFinalBalance + BigInt(transactions[0].value) + BigInt(transactions[1].value))
    })

    it('should execute a batch transaction with contract calls and threshold >1', async () => {
      const { accounts, contractNetworks, erc20Mintable } = await setupTests()
      const [account1, account2, account3] = accounts
      const safe = await getSafeWithOwners([account1.address, account2.address, account3.address])
      const safeAddress = await safe.getAddress()
      const ethAdapter1 = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter: ethAdapter1,
        safeAddress,
        contractNetworks
      })
      const ethAdapter2 = await getEthAdapter(account2.signer)
      const safeSdk2 = await safeSdk1.connect({ ethAdapter: ethAdapter2 })
      const ethAdapter3 = await getEthAdapter(account3.signer)
      const safeSdk3 = await safeSdk1.connect({ ethAdapter: ethAdapter3 })

      await erc20Mintable.mint(safeAddress, '1200000000000000000') // 1.2 ERC20
      const safeInitialERC20Balance = await erc20Mintable.balanceOf(safeAddress)
      chai.expect(safeInitialERC20Balance.toString()).to.be.eq('1200000000000000000') // 1.2 ERC20
      const accountInitialERC20Balance = await erc20Mintable.balanceOf(account2.address)
      chai.expect(accountInitialERC20Balance.toString()).to.be.eq('0') // 0 ERC20

      const transactions: MetaTransactionData[] = [
        {
          to: await erc20Mintable.getAddress(),
          value: '0',
          data: erc20Mintable.interface.encodeFunctionData('transfer', [
            account2.address,
            '1100000000000000000' // 1.1 ERC20
          ])
        },
        {
          to: await erc20Mintable.getAddress(),
          value: '0',
          data: erc20Mintable.interface.encodeFunctionData('transfer', [
            account2.address,
            '100000000000000000' // 0.1 ERC20
          ])
        }
      ]
      const multiSendTx = await safeSdk1.createTransaction({ transactions })
      const signedMultiSendTx = await safeSdk1.signTransaction(multiSendTx)
      const txHash = await safeSdk2.getTransactionHash(multiSendTx)
      const txResponse1 = await safeSdk2.approveTransactionHash(txHash)
      await waitSafeTxReceipt(txResponse1)
      const txResponse2 = await safeSdk3.executeTransaction(signedMultiSendTx)
      await waitSafeTxReceipt(txResponse2)

      const safeFinalERC20Balance = await erc20Mintable.balanceOf(safeAddress)
      chai.expect(safeFinalERC20Balance.toString()).to.be.eq('0') // 0 ERC20
      const accountFinalERC20Balance = await erc20Mintable.balanceOf(account2.address)
      chai.expect(accountFinalERC20Balance.toString()).to.be.eq('1200000000000000000') // 1.2 ERC20
    })
  })
})
