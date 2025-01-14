import packageJson from '../../package.json'

function getProtocolKitVersion(): string {
  return packageJson.version
}

export default getProtocolKitVersion
