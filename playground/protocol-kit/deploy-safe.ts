import Safe, { SafeAccountConfig, getSafeAddressFromDeploymentTx } from '@safe-global/protocol-kit'
import { SafeVersion } from '@safe-global/types-kit'

import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { waitForTransactionReceipt } from 'viem/actions'
import semverSatisfies from 'semver/functions/satisfies'

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
  RPC_URL: sepolia.rpcUrls.default.http[0],
  DEPLOYER_ADDRESS_PRIVATE_KEY: '<DEPLOYER_ADDRESS_PRIVATE_KEY>',
  DEPLOY_SAFE: {
    OWNERS: ['OWNER_ADDRESS'],
    THRESHOLD: 1, // <SAFE_THRESHOLD>
    SALT_NONCE: '150000',
    SAFE_VERSION: '1.3.0'
  }
}

async function main() {
  console.log('Safe Account config: ', config.DEPLOY_SAFE)

  // Config of the deployed Safe
  const safeAccountConfig: SafeAccountConfig = {
    owners: config.DEPLOY_SAFE.OWNERS,
    threshold: config.DEPLOY_SAFE.THRESHOLD
  }

  const safeVersion = config.DEPLOY_SAFE.SAFE_VERSION as SafeVersion
  const saltNonce = config.DEPLOY_SAFE.SALT_NONCE

  // protocol-kit instance creation
  const protocolKit = await Safe.init({
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

  // The Account Abstraction feature is only available for Safes version 1.3.0 and above.
  if (semverSatisfies(safeVersion, '>=1.3.0')) {
    // check if its deployed
    console.log('Safe Account deployed: ', await protocolKit.isSafeDeployed())

    // Predict deployed address
    const predictedSafeAddress = await protocolKit.getAddress()
    console.log('Predicted Safe address:', predictedSafeAddress)
  }

  console.log('Deploying Safe Account...')

  // Deploy the Safe account
  const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction()

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

  const txReceipt = await waitForTransactionReceipt(client, { hash: txHash })

  const safeAddress = getSafeAddressFromDeploymentTx(txReceipt, safeVersion)

  console.log('safeAddress:', safeAddress)

  // now you can use the Safe address in the instance of the protocol-kit
  protocolKit.connect({ safeAddress })

  console.log('is Safe deployed:', await protocolKit.isSafeDeployed())
  console.log('Safe Address:', await protocolKit.getAddress())
  console.log('Safe Owners:', await protocolKit.getOwners())
  console.log('Safe Threshold:', await protocolKit.getThreshold())
}

main()
