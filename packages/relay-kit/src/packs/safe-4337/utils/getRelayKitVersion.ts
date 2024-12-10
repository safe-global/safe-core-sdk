import packageJson from '../../../../package.json'

function getRelayKitVersion(): string {
  return packageJson.version
}

export default getRelayKitVersion
