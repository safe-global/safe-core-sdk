// @ts-nocheck

import { execSync } from 'child_process'

const playInput = process.argv[2]

const playgroundProtocolKitPaths = {
  'create-execute-transaction': 'protocol-kit/create-execute-transaction',
  'deploy-safe': 'protocol-kit/deploy-safe',
  'generate-safe-address': 'protocol-kit/generate-safe-address',
  'validate-signatures': 'protocol-kit/validate-signatures'
}
const playgroundApiKitPaths = {
  'propose-transaction': 'api-kit/propose-transaction',
  'confirm-transaction': 'api-kit/confirm-transaction',
  'execute-transaction': 'api-kit/execute-transaction'
}
const playgroundRelayKitPaths = {
  'api-kit-interoperability': 'relay-kit/api-kit-interoperability',
  'relay-paid-transaction': 'relay-kit/paid-transaction',
  'relay-sponsored-transaction': 'relay-kit/sponsored-transaction',
  'usdc-transfer-4337': 'relay-kit/usdc-transfer-4337',
  'usdc-transfer-4337-erc20': 'relay-kit/usdc-transfer-4337-erc20',
  'usdc-transfer-4337-sponsored': 'relay-kit/usdc-transfer-4337-sponsored',
  'usdc-transfer-4337-counterfactual': 'relay-kit/usdc-transfer-4337-counterfactual',
  'usdc-transfer-4337-erc20-counterfactual': 'relay-kit/usdc-transfer-4337-erc20-counterfactual',
  'usdc-transfer-4337-sponsored-counterfactual':
    'relay-kit/usdc-transfer-4337-sponsored-counterfactual'
}

const path =
  playgroundProtocolKitPaths[playInput] ||
  playgroundApiKitPaths[playInput] ||
  playgroundRelayKitPaths[playInput]

function printPlaygrounds(playgroundPaths: Record<string, string>) {
  const playgroundKits = Object.keys(playgroundPaths)
  playgroundKits.forEach((name) => {
    console.log(`> yarn play ${name}`)
  })
  console.log('')
}

if (!path) {
  console.log('Execute one of the existing playgrounds:\n')

  console.log('PROTOCOL KIT')
  printPlaygrounds(playgroundProtocolKitPaths)

  console.log('API KIT')
  printPlaygrounds(playgroundApiKitPaths)

  console.log('RELAY KIT')
  printPlaygrounds(playgroundRelayKitPaths)

  process.exit()
}

execSync(`ts-node ./playground/${path}`, { stdio: 'inherit' })
