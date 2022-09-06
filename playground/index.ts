import Safe, { SafeFactory } from '@gnosis.pm/safe-core-sdk'
import EthersAdapter from '@gnosis.pm/safe-ethers-lib'
import SafeServiceClient from '@gnosis.pm/safe-service-client'
import { ethers } from 'ethers'

// This file can be used to play around with the Safe Core SDK

const config = {
  RPC_URL: 'https://goerli.infura.io/v3/<INFURA_TOKEN>',
  SAFE_ADDRESS: '<SAFE_ADDRESS>',
  SAFE_OWNERS_PRIVATE_KEYS: [
    '<OWNER_1_PRIVATE_KEY>',
    '<OWNER_2_PRIVATE_KEY>',
    // ...
  ],
  SAFE_TRANSACTION_SERVICE_URL: '<SAFE_TRANSACTION_SERVICE_URL>'
}

async function main() {
  console.log('<<< SAFE CORE SDK PLAYGROUND >>>')

  const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL)
  const signers = config.SAFE_OWNERS_PRIVATE_KEYS.map(
    (privateKey) => new ethers.Wallet(privateKey, provider)
  )

  // Display Safe info
  const owners = await Promise.all(signers.map(async (signer) => await signer.getAddress()))
  console.log('SAFE_OWNERS:', owners.toString())

  // Select the signer that will be connected to the Core SDK
  const currentSignerIndex = 0
  const currentSigner = signers[currentSignerIndex]

  // EthAdapter instance
  const ethAdapter = new EthersAdapter({
    ethers,
    signer: currentSigner
  })

  // Safe Core SDK instance
  const safe = await Safe.create({
    ethAdapter,
    safeAddress: config.SAFE_ADDRESS
  })

  // SafeFactory instance
  const safeFactory = SafeFactory.create({ ethAdapter })

  // Safe Service Client instance
  const safeService = new SafeServiceClient({
    txServiceUrl: config.SAFE_TRANSACTION_SERVICE_URL,
    ethAdapter
  })

  // Deploy new Safes?
  // Propose transactions?
  // Sign transactions?
  // Execute transactions?
  // And much more...
}

main()
