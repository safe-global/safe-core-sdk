import { deployments } from 'hardhat'
import { GetContractReturnType, Abi, WalletClient } from 'viem'

import { Account, getAccounts } from './setupTestNetwork'
import { ContractNetworksConfig, getContractNetworks } from './setupContractNetworks'
import { getSafeWithOwners } from './setupContracts'
import { safeVersionDeployed } from '../hardhat/deploy/deploy-contracts'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

type SetupTestsOptions = {
  safeConfig?: {
    numberOfOwners: number
    threshold?: number
  }
  predictedSafeConfig?: {
    numberOfOwners: number
    threshold?: number
  }
}

type SetupTestsReturnType = {
  safe: GetContractReturnType<Abi, WalletClient>
  accounts: Account[]
  contractNetworks: ContractNetworksConfig
  chainId: bigint
  predictedSafe: PredictedSafeProps
}

type SafeAccountConfig = {
  owners: string[]
  threshold: number
}

type SafeDeploymentConfig = {
  safeVersion?: SafeVersion
}

type PredictedSafeProps = {
  safeAccountConfig: SafeAccountConfig
  safeDeploymentConfig?: SafeDeploymentConfig
}

export const setupTests: (options?: SetupTestsOptions) => Promise<SetupTestsReturnType> =
  deployments.createFixture(async ({ deployments, getChainId }, options?: SetupTestsOptions) => {
    const { safeConfig, predictedSafeConfig } = options || {}

    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId = BigInt(await getChainId())
    const contractNetworks = await getContractNetworks(chainId)
    const safe = await getSafeWithOwners(
      safeConfig
        ? [...accounts.slice(0, safeConfig?.numberOfOwners).map((account) => account.address)]
        : [accounts[0].address],
      safeConfig?.threshold || 1
    )
    const predictedSafe = {
      safeAccountConfig: {
        owners: predictedSafeConfig
          ? [
              ...accounts
                .slice(0, predictedSafeConfig?.numberOfOwners)
                .map((account) => account.address)
            ]
          : [accounts[0].address],
        threshold: predictedSafeConfig?.threshold || 1
      },
      safeDeploymentConfig: {
        safeVersion: safeVersionDeployed
      }
    }

    return {
      safe,
      accounts,
      contractNetworks,
      chainId,
      predictedSafe
    }
  })
