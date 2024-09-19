import Safe, { SafeAccountConfig } from '@safe-global/protocol-kit'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

// This file can be used to play around with the Safe Core SDK

interface Config {
  RPC_URL: string
  DEPLOYER_ADDRESS_PRIVATE_KEY: string
  DEPLOY_SAFE: {
    OWNERS: string[]
    THRESHOLD: number
    SALT_NONCE: string
    SAFE_VERSION: string
  }
}

const config: Config = {
  RPC_URL: 'https://rpc.sepolia.org',
  DEPLOYER_ADDRESS_PRIVATE_KEY: '<DEPLOYER_ADDRESS_PRIVATE_KEY>',
  DEPLOY_SAFE: {
    OWNERS: ['OWNER_ADDRESS'],
    THRESHOLD: 1, // <SAFE_THRESHOLD>
    SALT_NONCE: '150000',
    SAFE_VERSION: '1.3.0'
  }
}

async function main() {
  const safeVersion = config.DEPLOY_SAFE.SAFE_VERSION as SafeVersion

  console.log('safe config: ', config.DEPLOY_SAFE)

  // Config of the deployed Safe
  const safeAccountConfig: SafeAccountConfig = {
    owners: config.DEPLOY_SAFE.OWNERS,
    threshold: config.DEPLOY_SAFE.THRESHOLD
  }

  const saltNonce = config.DEPLOY_SAFE.SALT_NONCE

  // Create SDK instance
  const safeSDK = await Safe.init({
    provider: config.RPC_URL,
    signer: config.DEPLOYER_ADDRESS_PRIVATE_KEY,
    predictedSafe: {
      safeAccountConfig,
      safeDeploymentConfig: {
        saltNonce,
        safeVersion
      }
    }
  })

  // check if its deployed
  console.log('Safe Account deployed: ', await safeSDK.isSafeDeployed())

  // Predict deployed address
  const predictedSafeAddress = await safeSDK.getAddress()

  console.log('Predicted Safe address:', predictedSafeAddress)

  console.log('Deploying Safe Account...')

  // Deploy the Safe account
  const deploymentTransaction = await safeSDK.createSafeDeploymentTransaction()

  console.log('deploymentTransaction: ', deploymentTransaction)

  const account = privateKeyToAccount(`0x${config.DEPLOYER_ADDRESS_PRIVATE_KEY}`)

  const client = createWalletClient({
    account,
    chain: sepolia,
    transport: http(config.RPC_URL)
  })

  const txHash = await client.sendTransaction({
    to: deploymentTransaction.to,
    value: BigInt(deploymentTransaction.value),
    data: deploymentTransaction.data as `0x${string}`
  })

  console.log('Transaction hash:', txHash)
}

main()
