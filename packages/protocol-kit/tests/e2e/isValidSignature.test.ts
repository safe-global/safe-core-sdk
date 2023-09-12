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

chai.use(chaiAsPromised)

const hashMessage = (message: string): string => {
  return soliditySha3(utf8ToHex(message)) || ''
}

const MESSAGE = 'testing isValidateSignature!'

describe('isValidSignature', async () => {
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

  itif(safeVersionDeployed >= '1.3.0')('should validate signed messages', async () => {
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

    const txData = signMessageLibContract.encode('signMessage', [hashMessage(MESSAGE)])

    const safeTransactionData: SafeTransactionDataPartial = {
      to: customContract.signMessageLibAddress,
      value: '0',
      data: txData,
      operation: OperationType.DelegateCall
    }

    const tx = await safeSdk1.createTransaction({ safeTransactionData })
    const signedTx = await safeSdk1.signTransaction(tx)
    const txResponse = await safeSdk1.executeTransaction(signedTx)

    await waitSafeTxReceipt(txResponse)

    const txResponse2 = await safeSdk1.isValidSignature(hashMessage(MESSAGE), '0x')

    chai.expect(txResponse2).to.be.true
  })

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
})
