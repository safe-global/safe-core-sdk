import { execSync } from 'child_process'

const playInput = process.argv[2]

const playgroundProtocolKitPaths = {
  'deploy-safe': 'protocol-kit/deploy-safe',
  'generate-safe-address': 'protocol-kit/generate-safe-address'
}
const playgroundApiKitPaths = {
  'propose-transaction': 'api-kit/propose-transaction',
  'confirm-transaction': 'api-kit/confirm-transaction',
  'execute-transaction': 'api-kit/execute-transaction'
}
const playgroundRelayKitPaths = {
  'relay-paid-transaction': 'relay-kit/paid-transaction',
  'relay-sponsored-transaction': 'relay-kit/sponsored-transaction'
}

const path =
  playgroundProtocolKitPaths[playInput] ||
  playgroundApiKitPaths[playInput] ||
  playgroundRelayKitPaths[playInput]

function printPlaygrounds(playgroundPaths) {
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
