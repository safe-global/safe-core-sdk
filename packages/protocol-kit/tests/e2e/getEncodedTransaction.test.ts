import Safe from '@safe-global/protocol-kit/index'
import { safeVersionDeployed } from '@safe-global/testing-kit'
import chai from 'chai'
import { deployments } from 'hardhat'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getSafeWithOwners } from './utils/setupContracts'
import { getEip1193Provider } from './utils/setupProvider'
import { getAccounts } from './utils/setupTestNetwork'
import { itif } from './utils/helpers'

describe('getEncodedTransaction', () => {
  const setupTests = deployments.createFixture(async ({ deployments, getChainId }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId = BigInt(await getChainId())
    const contractNetworks = await getContractNetworks(chainId)
    const provider = getEip1193Provider()

    return {
      accounts,
      contractNetworks,
      provider
    }
  })

  itif(safeVersionDeployed >= '1.3.0')('should return a transaction encoded', async () => {
    const { accounts, contractNetworks, provider } = await setupTests()
    const [account1, account2] = accounts

    const safe = await getSafeWithOwners([account1.address])
    const safeAddress = safe.address

    const safeSdk = await Safe.init({
      provider,
      safeAddress,
      contractNetworks
    })

    const safeTransactionData = {
      to: account2.address,
      value: '500000000000000000', // 0.5 ETH
      data: '0x'
    }

    const transaction = await safeSdk.createTransaction({ transactions: [safeTransactionData] })

    const encodedTransaction = await safeSdk.getEncodedTransaction(transaction)

    chai
      .expect(encodedTransaction)
      .to.be.equal(
        '0x6a761202000000000000000000000000ffcf8fdee72ac11b5c542428b35eef5769c409f000000000000000000000000000000000000000000000000006f05b59d3b200000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
      )
  })

  itif(safeVersionDeployed <= '1.2.0')('should return a transaction encoded', async () => {
    const { accounts, contractNetworks, provider } = await setupTests()
    const [account1, account2] = accounts

    const safe = await getSafeWithOwners([account1.address])
    const safeAddress = safe.address

    const safeSdk = await Safe.init({
      provider,
      safeAddress,
      contractNetworks
    })

    const safeTransactionData = {
      to: account2.address,
      value: '500000000000000000', // 0.5 ETH
      data: '0x'
    }

    const transaction = await safeSdk.createTransaction({ transactions: [safeTransactionData] })

    const encodedTransaction = await safeSdk.getEncodedTransaction(transaction)

    chai
      .expect(encodedTransaction)
      .to.be.equal(
        '0x6a761202000000000000000000000000ffcf8fdee72ac11b5c542428b35eef5769c409f000000000000000000000000000000000000000000000000006f05b59d3b200000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000052090000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
      )
  })

  it('should return a signed transaction with the signatures encoded', async () => {
    const { accounts, contractNetworks, provider } = await setupTests()
    const [account1, account2] = accounts

    const safe = await getSafeWithOwners([account1.address])
    const safeAddress = safe.address

    const safeSdk = await Safe.init({
      provider,
      safeAddress,
      contractNetworks
    })

    const safeTransactionData = {
      to: account2.address,
      value: '500000000000000000', // 0.5 ETH
      data: '0x'
    }

    const transaction = await safeSdk.createTransaction({ transactions: [safeTransactionData] })

    const signedTransaction = await safeSdk.signTransaction(transaction)

    const encodedSignedTransaction = await safeSdk.getEncodedTransaction(signedTransaction)

    chai
      .expect(encodedSignedTransaction)
      .to.contains(signedTransaction.encodedSignatures().replace('0x', ''))
  })
})
