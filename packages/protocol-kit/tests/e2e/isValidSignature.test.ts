import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import Safe, { PredictedSafeProps } from '@safe-global/protocol-kit/index'
import { OperationType, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, waffle } from 'hardhat'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getSafeWithOwners, getSignMessageLib } from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'
import { waitSafeTxReceipt } from './utils/transactions'
import { hashMessage } from 'ethers/lib/utils'

chai.use(chaiAsPromised)

// https://ethereum.org/es/developers/tutorials/eip-1271-smart-contract-signatures
describe.only('isValidSignature', async () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks = await getContractNetworks(chainId)

    return {
      safe: await getSafeWithOwners([accounts[0].address, accounts[1].address]),
      accounts,
      contractNetworks
    }
  })

  it.only('should validate On-chain messages', async () => {
    const { accounts, contractNetworks } = await setupTests()
    const [account1] = accounts
    const safe = await getSafeWithOwners([account1.address])
    const ethAdapter1 = await getEthAdapter(account1.signer)
    const safeSdk1 = await Safe.create({
      ethAdapter: ethAdapter1,
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

    const txData = signMessageLibContract.encode('signMessage', [hashMessage('Hello world')])

    const safeTransactionData: SafeTransactionDataPartial = {
      to: customContract.signMessageLibAddress,
      value: '0',
      data: txData,
      operation: OperationType.DelegateCall
    }

    const tx = await safeSdk1.createTransaction({ safeTransactionData })
    const txHash = await safeSdk1.getTransactionHash(tx)
    const signature = await safeSdk1.signTransactionHash(txHash)
    const signedTx = await safeSdk1.signTransaction(tx)

    const txResponse = await safeSdk1.executeTransaction(signedTx)

    const txReceipt = await waitSafeTxReceipt(txResponse)

    console.log('Transaction', tx)
    console.log('Transaction Hash', txHash)
    console.log('Signature', signature)
    console.log('Signed Transaction', signedTx)
    console.log('Transaction Response', txResponse)
    console.log('Transaction Receipt', txReceipt)

    const txResponse2 = await safeSdk1.isValidSignature(hashMessage('Hello world'), '0x')

    chai.expect(txResponse2).to.be.true
  })

  it('should validate Off-chain messages', async () => {
    const { accounts, contractNetworks } = await setupTests()
    const [account1] = accounts
    const safe = await getSafeWithOwners([account1.address])
    const ethAdapter1 = await getEthAdapter(account1.signer)
    const safeSdk1 = await Safe.create({
      ethAdapter: ethAdapter1,
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

    const txData = signMessageLibContract.encode('signMessage', [hashMessage('Hello world')])

    const safeTransactionData: SafeTransactionDataPartial = {
      to: customContract.signMessageLibAddress,
      value: '0',
      data: txData,
      operation: OperationType.DelegateCall
    }

    const tx = await safeSdk1.createTransaction({ safeTransactionData })
    const txHash = await safeSdk1.getTransactionHash(tx)
    const signature = await safeSdk1.signTransactionHash(txHash)
    const signedTx = await safeSdk1.signTransaction(tx)

    console.log('Transaction', tx)
    console.log('Transaction Hash', txHash)
    console.log('Signature', signature)
    console.log('Signed Transaction', signedTx)

    const txResponse2 = await safeSdk1.isValidSignature(hashMessage('Hello world'), signature.data)

    chai.expect(txResponse2).to.be.true
  })
})
