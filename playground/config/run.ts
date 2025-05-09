// @ts-nocheck

import { execSync } from 'child_process'

const playInput = process.argv[2]

const playgroundProtocolKitPaths = {
  'create-execute-transaction': 'protocol-kit/create-execute-transaction',
  'deploy-safe': 'protocol-kit/deploy-safe',
  'replicate-address': 'protocol-kit/replicate-address',
  'generate-safe-address': 'protocol-kit/generate-safe-address',
  'validate-signatures': 'protocol-kit/validate-signatures',
  'estimate-gas': 'protocol-kit/estimate-gas'
}
const playgroundApiKitPaths = {
  'propose-transaction': 'api-kit/propose-transaction',
  'confirm-transaction': 'api-kit/confirm-transaction',
  'execute-transaction': 'api-kit/execute-transaction'
}
const playgroundRelayKitPaths = {
  'gelato-paid-transaction': 'relay-kit/gelato-paid-transaction',
  'gelato-sponsored-transaction': 'relay-kit/gelato-sponsored-transaction',
  'userop-api-kit-interoperability': 'relay-kit/userop-api-kit-interoperability',
  userop: 'relay-kit/userop',
  'userop-generic-estimator': 'relay-kit/userop-generic-estimator',
  'userop-counterfactual': 'relay-kit/userop-counterfactual',
  'userop-counterfactual-generic-estimator': 'relay-kit/userop-counterfactual-generic-estimator',
  'userop-erc20-paymaster': 'relay-kit/userop-erc20-paymaster',
  'userop-erc20-paymaster-generic-estimator': 'relay-kit/userop-erc20-paymaster-generic-estimator',
  'userop-erc20-paymaster-counterfactual': 'relay-kit/userop-erc20-paymaster-counterfactual',
  'userop-verifying-paymaster': 'relay-kit/userop-verifying-paymaster',
  'userop-verifying-paymaster-generic-estimator': 'relay-kit/userop-verifying-paymaster-generic-estimator',
  'userop-verifying-paymaster-counterfactual':
    'relay-kit/userop-verifying-paymaster-counterfactual',
  'userop-parallel-execution': 'relay-kit/userop-parallel-execution'
}

const playgroundStarterKitPaths = {
  'send-transactions': 'sdk-starter-kit/send-transactions',
  'send-on-chain-message': 'sdk-starter-kit/send-on-chain-message',
  'send-off-chain-message': 'sdk-starter-kit/send-off-chain-message',
  'send-safe-operation': 'sdk-starter-kit/send-safe-operation',
  'owner-management': 'sdk-starter-kit/owner-management'
}

const path =
  playgroundProtocolKitPaths[playInput] ||
  playgroundApiKitPaths[playInput] ||
  playgroundRelayKitPaths[playInput] ||
  playgroundStarterKitPaths[playInput]

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

  console.log('SDK STARTER KIT')
  printPlaygrounds(playgroundStarterKitPaths)

  process.exit()
}

execSync(`ts-node ./playground/${path}`, { stdio: 'inherit' })
