import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments } from 'hardhat'
import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import Safe, { PredictedSafeProps } from '@safe-global/protocol-kit/index'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getSafeWithOwners, getMultiSendCallOnly, getERC20Mintable } from './utils/setupContracts'
import { getEip1193Provider } from './utils/setupProvider'
import { getAccounts } from './utils/setupTestNetwork'
import { OperationType } from '@safe-global/safe-core-sdk-types'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import { encodeFunctionData } from 'viem'

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
      accounts,
      contractNetworks,
      predictedSafe,
      chainId
    }
  })

  it('should return a batch of the provided transactions', async () => {
    const { accounts, contractNetworks } = await setupTests()
    const [account1, account2] = accounts
    const erc20Mintable = await getERC20Mintable()

    const safe = await getSafeWithOwners([account1.address])
    const provider = getEip1193Provider()
    const safeAddress = safe.address

    const safeSdk = await Safe.init({
      provider,
      safeAddress,
      contractNetworks
    })

    const dumpTransfer = {
      to: ZERO_ADDRESS,
      value: AMOUNT_TO_TRANSFER,
      data: encodeFunctionData({
        abi: erc20Mintable.abi,
        functionName: 'transfer',
        args: [account2.address, AMOUNT_TO_TRANSFER] // 0.1 ERC20
      }),
      operation: OperationType.Call
    }

    const transactions = [dumpTransfer, dumpTransfer]

    const batchTransaction = await safeSdk.createTransactionBatch(transactions)

    const multiSendContractAddress = await (await getMultiSendCallOnly()).contract.address

    chai.expect(batchTransaction).to.be.deep.equal({
      to: multiSendContractAddress,
      value: '0',
      data: '0x8d80ff0a000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000aa00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006f05b59d3b20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006f05b59d3b20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    })
  })
})
