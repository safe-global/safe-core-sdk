import {
  SafeProvider,
  SafeAccountConfig,
  SafeDeploymentConfig,
  predictSafeAddress
} from '@safe-global/protocol-kit'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

// This script can be used to generate a custom Safe address

const config: Config = {
  // REQUIRED PARAMETERS
  owners: ['0x680cde08860141F9D223cE4E620B10Cd6741037E'],
  rpcUrl: 'https://sepolia.gateway.tenderly.co',
  // OPTIONAL PARAMETERS
  pattern: '0x5afe',
  safeVersion: '1.3.0',
  threshold: 1,
  initialSaltNonce: 0 // initial saltNonce
}

async function generateSafeAddresses() {
  let saltNonce = config.initialSaltNonce
  let iteractions = 0

  const safeAccountConfig: SafeAccountConfig = {
    owners: config.owners,
    threshold: config.threshold
  }

  const chainId = await safeProvider.getChainId()

  // infinite loop to search a valid Safe addresses
  for (saltNonce; true; saltNonce++ && iteractions++) {
    // we updete the Deployment config with the current saltNonce
    const safeDeploymentConfig: SafeDeploymentConfig = {
      saltNonce: saltNonce.toString(), // this change each iteraction
      safeVersion: config.safeVersion
    }

    // we predict the Safe address using the current saltNonce
    const predictedSafeAddress = await predictSafeAddress({
      safeProvider,
      chainId,
      safeAccountConfig,
      safeDeploymentConfig
    })

    // we print a message in the console with some data about the performance
    printPerfomanceMessage(iteractions, saltNonce)

    // we check if its a valid address based on the provided pattern
    const isValidAddress = checkAddressPattern(predictedSafeAddress)

    if (isValidAddress) {
      // we print a message in the console if we found a valid Safe address
      printValidAddress(predictedSafeAddress, saltNonce)
    }
  }
}

const safeProvider = new SafeProvider({
  provider: config.rpcUrl
})

const start = Date.now()

printFirstMessage()

generateSafeAddresses()

interface Config {
  safeVersion: SafeVersion
  rpcUrl: string
  owners: string[]
  threshold: number
  initialSaltNonce: number
  pattern: string
}

const addressesFound: { predictedSafeAddress: string; saltNonce: number }[] = []

// util functions

// check address pattern
function checkAddressPattern(address: string): boolean {
  return address.startsWith(config.pattern)
}

// used to print the initial message
function printFirstMessage(): void {
  console.clear()

  console.log(`Searching for a Safe address starting with "${config.pattern}..." `)

  console.log(' ')
  console.log('Addresses found:  0')
  console.log('------------------------------------------------------------')
}

// used to print the performance message
function printPerfomanceMessage(addresses: number, saltNonce: number): void {
  const seconds = (Date.now() - start) / 1000
  const addressesPerSecond = (addresses / seconds).toFixed(8)

  process.stdout.write(
    `\rSpeed: ${addressesPerSecond} addresses/second   ------  Current saltNonce: ${saltNonce}`
  )
}

// used to print the found addresses
function printValidAddress(validAddress: string, saltNonce: number): void {
  addressesFound.push({
    predictedSafeAddress: validAddress,
    saltNonce
  })

  console.clear()

  console.log(`Searching for a Safe address starting with "${config.pattern}..." `)

  console.log(' ')
  console.log('Addresses found:  ', addressesFound.length)
  console.log('------------------------------------------------------------')
  addressesFound.forEach(({ predictedSafeAddress, saltNonce }) => {
    console.log('Safe Address: ', predictedSafeAddress)
    console.log('saltNonce: ', saltNonce)
    console.log('------------------------------------------------------------')
  })
  console.log(' ')
}
