import { safeVersionDeployed, setupTests, getERC20Mintable, itif } from '@safe-global/testing-kit'
import Safe, {
  SafeTransactionOptionalProps,
  standardizeSafeTransactionData,
  SafeContractImplementationType as SafeContract
} from '@safe-global/protocol-kit/index'
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getEip1193Provider } from './utils/setupProvider'
import { encodeFunctionData } from 'viem'

chai.use(chaiAsPromised)

const BASE_OPTIONS: SafeTransactionOptionalProps = {
  baseGas: '111',
  gasPrice: '222',
  gasToken: '0x333',
  refundReceiver: '0x444',
  nonce: 555,
  safeTxGas: '666'
}

describe('Transactions creation', () => {
  const provider = getEip1193Provider()

  describe('standardizeSafeTransactionData', async () => {
    itif(safeVersionDeployed >= '1.3.0')(
      'should return a transaction with safeTxGas=0 if safeVersion>=1.3.0 and gasPrice=0',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const txDataPartial: SafeTransactionDataPartial = {
          to: accounts[1].address,
          value: '0',
          data: '0x'
        }
        const safeTxData = await standardizeSafeTransactionData({
          safeContract: safeSdk.getContractManager().safeContract as SafeContract,
          provider,
          tx: txDataPartial,
          contractNetworks
        })
        chai.expect(safeTxData.safeTxGas).to.be.eq('0')
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should return a transaction with estimated safeTxGas if safeVersion>=1.3.0 and gasPrice>0',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const txDataPartial: SafeTransactionDataPartial = {
          to: accounts[1].address,
          value: '0',
          data: '0x',
          gasPrice: BASE_OPTIONS.gasPrice
        }
        const safeTxData = await standardizeSafeTransactionData({
          safeContract: safeSdk.getContractManager().safeContract as SafeContract,
          provider,
          tx: txDataPartial,
          contractNetworks
        })
        chai.expect(BigInt(safeTxData.safeTxGas) > 0).to.be.true
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should return a transaction with defined safeTxGas if safeVersion>=1.3.0',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const safeTxGas = BASE_OPTIONS.safeTxGas
        const txDataPartial: SafeTransactionDataPartial = {
          to: accounts[1].address,
          value: '0',
          data: '0x',
          safeTxGas
        }
        const safeTxData = await standardizeSafeTransactionData({
          safeContract: safeSdk.getContractManager().safeContract as SafeContract,
          provider,
          tx: txDataPartial,
          contractNetworks
        })
        chai.expect(safeTxData.safeTxGas).to.be.eq(safeTxGas)
      }
    )

    itif(safeVersionDeployed < '1.3.0')(
      'should return a transaction with estimated safeTxGas if safeVersion<1.3.0',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const txDataPartial: SafeTransactionDataPartial = {
          to: accounts[1].address,
          value: '0',
          data: '0x'
        }
        const safeTxData = await standardizeSafeTransactionData({
          safeContract: safeSdk.getContractManager().safeContract as SafeContract,
          provider,
          tx: txDataPartial,
          contractNetworks
        })
        chai.expect(BigInt(safeTxData.safeTxGas) > 0).to.be.true
      }
    )

    itif(safeVersionDeployed < '1.3.0')(
      'should return a transaction with defined safeTxGas of 0 if safeVersion<1.3.0',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const safeTxGas = '0'
        const txDataPartial: SafeTransactionDataPartial = {
          to: accounts[1].address,
          value: '0',
          data: '0x',
          safeTxGas
        }
        const safeTxData = await standardizeSafeTransactionData({
          safeContract: safeSdk.getContractManager().safeContract as SafeContract,
          provider,
          tx: txDataPartial,
          contractNetworks
        })
        chai.expect(safeTxData.safeTxGas).to.be.eq(safeTxGas)
      }
    )

    itif(safeVersionDeployed < '1.3.0')(
      'should return a transaction with defined safeTxGas if safeVersion<1.3.0',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const safeTxGas = BASE_OPTIONS.safeTxGas
        const txDataPartial: SafeTransactionDataPartial = {
          to: accounts[1].address,
          value: '0',
          data: '0x',
          safeTxGas
        }
        const safeTxData = await standardizeSafeTransactionData({
          safeContract: safeSdk.getContractManager().safeContract as SafeContract,
          provider,
          tx: txDataPartial,
          contractNetworks
        })
        chai.expect(safeTxData.safeTxGas).to.be.eq(safeTxGas)
      }
    )
  })

  describe('createTransaction', async () => {
    it('should create a single transaction with gasPrice=0', async () => {
      const { predictedSafe, accounts, contractNetworks } = await setupTests()
      const [, account2] = accounts
      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })
      const safeTransactionData = {
        to: account2.address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      }
      const options = {
        ...BASE_OPTIONS,
        gasPrice: '0'
      }
      const tx = safeSdk.createTransaction({ transactions: [safeTransactionData], options })
      chai.expect(tx).to.be.rejectedWith('Safe is not deployed')
    })

    it('should create a single transaction with gasPrice=0', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData = {
        to: accounts[1].address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({
        transactions: [safeTransactionData],
        options: BASE_OPTIONS
      })
      chai.expect(tx.data.to).to.be.eq(accounts[1].address)
      chai.expect(tx.data.value).to.be.eq('500000000000000000')
      chai.expect(tx.data.data).to.be.eq('0x')
      chai.expect(tx.data.baseGas).to.be.eq(BASE_OPTIONS.baseGas)
      chai.expect(tx.data.gasPrice).to.be.eq(BASE_OPTIONS.gasPrice)
      chai.expect(tx.data.gasToken).to.be.eq(BASE_OPTIONS.gasToken)
      chai.expect(tx.data.refundReceiver).to.be.eq(BASE_OPTIONS.refundReceiver)
      chai.expect(tx.data.nonce).to.be.eq(BASE_OPTIONS.nonce)
      chai.expect(tx.data.safeTxGas).to.be.eq(BASE_OPTIONS.safeTxGas)
    })

    it('should create a single transaction with gasPrice>0', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData = {
        to: accounts[1].address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({
        transactions: [safeTransactionData],
        options: BASE_OPTIONS
      })
      chai.expect(tx.data.to).to.be.eq(accounts[1].address)
      chai.expect(tx.data.value).to.be.eq('500000000000000000')
      chai.expect(tx.data.data).to.be.eq('0x')
      chai.expect(tx.data.baseGas).to.be.eq(BASE_OPTIONS.baseGas)
      chai.expect(tx.data.gasPrice).to.be.eq(BASE_OPTIONS.gasPrice)
      chai.expect(tx.data.gasToken).to.be.eq(BASE_OPTIONS.gasToken)
      chai.expect(tx.data.refundReceiver).to.be.eq(BASE_OPTIONS.refundReceiver)
      chai.expect(tx.data.nonce).to.be.eq(BASE_OPTIONS.nonce)
      chai.expect(tx.data.safeTxGas).to.be.eq(BASE_OPTIONS.safeTxGas)
    })

    it('should create a single transaction when passing a transaction array with length=1', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData = {
        to: accounts[1].address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({ transactions: [safeTransactionData] })
      chai.expect(tx.data.to).to.be.eq(accounts[1].address)
      chai.expect(tx.data.value).to.be.eq('500000000000000000')
      chai.expect(tx.data.data).to.be.eq('0x')
    })

    it('should create a single transaction when passing a transaction array with length=1 and options', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData = {
        to: accounts[1].address,
        value: '500000000000000000', // 0.5 ETH
        data: '0x'
      }
      const options: SafeTransactionOptionalProps = BASE_OPTIONS
      const tx = await safeSdk.createTransaction({ transactions: [safeTransactionData], options })
      chai.expect(tx.data.to).to.be.eq(accounts[1].address)
      chai.expect(tx.data.value).to.be.eq('500000000000000000')
      chai.expect(tx.data.data).to.be.eq('0x')
      chai.expect(tx.data.baseGas).to.be.eq(BASE_OPTIONS.baseGas)
      chai.expect(tx.data.gasPrice).to.be.eq(BASE_OPTIONS.gasPrice)
      chai.expect(tx.data.gasToken).to.be.eq(BASE_OPTIONS.gasToken)
      chai.expect(tx.data.refundReceiver).to.be.eq(BASE_OPTIONS.refundReceiver)
      chai.expect(tx.data.nonce).to.be.eq(BASE_OPTIONS.nonce)
      chai.expect(tx.data.safeTxGas).to.be.eq(BASE_OPTIONS.safeTxGas)
    })

    it('should fail when creating a MultiSend transaction passing a transaction array with length=0', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const tx = safeSdk.createTransaction({ transactions: [] })
      await chai.expect(tx).to.be.rejectedWith('Invalid empty array of transactions')
    })

    it('should create a MultiSend transaction', async () => {
      const { safe, accounts, contractNetworks, chainId } = await setupTests()
      const erc20Mintable = await getERC20Mintable()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const transactions = [
        {
          to: erc20Mintable.address,
          value: '0',
          data: encodeFunctionData({
            abi: erc20Mintable.abi,
            functionName: 'transfer',
            args: [accounts[1].address, '1100000000000000000'] // 1.1 ERC20
          })
        },
        {
          to: erc20Mintable.address,
          value: '0',
          data: encodeFunctionData({
            abi: erc20Mintable.abi,
            functionName: 'transfer',
            args: [accounts[1].address, '100000000000000000'] // 0.1 ERC20
          })
        }
      ]
      const multiSendTx = await safeSdk.createTransaction({ transactions })
      chai
        .expect(multiSendTx.data.to)
        .to.be.eq(contractNetworks[chainId.toString()].multiSendAddress)
    })

    it('should create a MultiSend transaction with options', async () => {
      const { safe, accounts, contractNetworks, chainId } = await setupTests()
      const erc20Mintable = await getERC20Mintable()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const options = BASE_OPTIONS

      const transactions = [
        {
          to: erc20Mintable.address,
          value: '0',
          data: encodeFunctionData({
            abi: erc20Mintable.abi,
            functionName: 'transfer',
            args: [accounts[1].address, '1100000000000000000'] // 1.1 ERC20
          })
        },
        {
          to: erc20Mintable.address,
          value: '0',
          data: encodeFunctionData({
            abi: erc20Mintable.abi,
            functionName: 'transfer',
            args: [accounts[1].address, '100000000000000000'] // 0.1 ERC20
          })
        }
      ]
      const multiSendTx = await safeSdk.createTransaction({ transactions, options })
      chai
        .expect(multiSendTx.data.to)
        .to.be.eq(contractNetworks[chainId.toString()].multiSendAddress)
      chai.expect(multiSendTx.data.value).to.be.eq('0')
      chai.expect(multiSendTx.data.baseGas).to.be.eq(BASE_OPTIONS.baseGas)
      chai.expect(multiSendTx.data.gasPrice).to.be.eq(BASE_OPTIONS.gasPrice)
      chai.expect(multiSendTx.data.gasToken).to.be.eq(BASE_OPTIONS.gasToken)
      chai.expect(multiSendTx.data.refundReceiver).to.be.eq(BASE_OPTIONS.refundReceiver)
      chai.expect(multiSendTx.data.nonce).to.be.eq(BASE_OPTIONS.nonce)
      chai.expect(multiSendTx.data.safeTxGas).to.be.eq(BASE_OPTIONS.safeTxGas)
    })

    itif(safeVersionDeployed < '1.3.0')(
      'should fail to create a transaction if the Safe with version <v1.3.0 is using predicted config',
      async () => {
        const { safe, predictedSafe, contractNetworks } = await setupTests()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          predictedSafe,
          contractNetworks
        })
        const safeTransactionData = {
          to: safeAddress,
          value: '0',
          data: '0x'
        }
        const tx = safeSdk.createTransaction({ transactions: [safeTransactionData] })
        await chai
          .expect(tx)
          .to.be.rejectedWith(
            'Account Abstraction functionality is not available for Safes with version lower than v1.3.0'
          )
      }
    )
  })
})
