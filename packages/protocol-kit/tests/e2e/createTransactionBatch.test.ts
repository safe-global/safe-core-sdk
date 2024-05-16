import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments } from 'hardhat'
import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import Safe, { PredictedSafeProps } from '@safe-global/protocol-kit/index'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getERC20Mintable, getSafeWithOwners, getMultiSendCallOnly } from './utils/setupContracts'
import { getEip1193Provider } from './utils/setupProvider'
import { getAccounts } from './utils/setupTestNetwork'
import { OperationType } from '@safe-global/safe-core-sdk-types'

chai.use(chaiAsPromised)

const AMOUNT_TO_TRANSFER = '500000000000000000' // 0.5 ETH

describe('createTransactionBatch', () => {
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

    return {
      erc20Mintable: await getERC20Mintable(),
      accounts,
      contractNetworks,
      predictedSafe,
      chainId
    }
  })

  it('should return a batch of the provided transactions', async () => {
    const { accounts, contractNetworks, erc20Mintable } = await setupTests()
    const [account1, account2] = accounts

    const safe = await getSafeWithOwners([account1.address])
    const provider = getEip1193Provider()
    const safeAddress = await safe.getAddress()

    const safeSdk = await Safe.init({
      provider,
      safeAddress,
      contractNetworks
    })

    const dumpTransfer = {
      to: await erc20Mintable.getAddress(),
      value: '0',
      data: erc20Mintable.interface.encodeFunctionData('transfer', [
        account2.address,
        AMOUNT_TO_TRANSFER
      ]),
      operation: OperationType.Call
    }

    const transactions = [dumpTransfer, dumpTransfer]

    const batchTransaction = await safeSdk.createTransactionBatch(transactions)

    const multiSendContractAddress = await (await getMultiSendCallOnly()).contract.getAddress()

    chai.expect(batchTransaction).to.be.deep.equal({
      to: multiSendContractAddress,
      value: '0',
      data: '0x8d80ff0a000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001320067b5656d60a809915323bf2c40a8bef15a152e3e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000ffcf8fdee72ac11b5c542428b35eef5769c409f000000000000000000000000000000000000000000000000006f05b59d3b200000067b5656d60a809915323bf2c40a8bef15a152e3e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000ffcf8fdee72ac11b5c542428b35eef5769c409f000000000000000000000000000000000000000000000000006f05b59d3b200000000000000000000000000000000'
    })
  })
})
