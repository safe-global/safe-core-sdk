import { keccak256 } from 'viem'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { SafeVersion } from '@safe-global/types-kit'
import { getContractDeployment } from '@safe-global/protocol-kit/contracts/config'

/**
 * Reads the mastercopy address from a Safe proxy contract.
 * The mastercopy address is stored at storage slot 0.
 *
 * @param safeProvider - The SafeProvider instance
 * @param safeAddress - The address of the Safe proxy
 * @returns The mastercopy address
 */
export async function getMasterCopyAddressFromProxy(
  safeProvider: SafeProvider,
  safeAddress: string
): Promise<string> {
  // Read storage at slot 0, which contains the mastercopy address
  const storage = await safeProvider.getStorageAt(safeAddress, '0x0')

  // The address is stored in the last 20 bytes (40 hex characters)
  // Format: 0x000000000000000000000000<address>
  const address = '0x' + storage.slice(-40)

  return safeProvider.getChecksummedAddress(address)
}

/**
 * Attempts to match a contract's bytecode hash against supported Safe L2 singleton versions.
 * Only supports 1.3.0 L2 and 1.4.1 L2 mastercopies.
 *
 * @param safeProvider - The SafeProvider instance
 * @param contractAddress - The address of the contract to check
 * @param chainId - The chain ID
 * @returns An object with the matched SafeVersion and whether it's L1, or undefined if no match is found
 */
export async function matchContractCodeToSafeVersion(
  safeProvider: SafeProvider,
  contractAddress: string,
  chainId: bigint
): Promise<{ version: SafeVersion; isL1: boolean } | undefined> {
  // Get the bytecode of the contract
  const contractCode = await safeProvider.getContractCode(contractAddress)

  if (!contractCode || contractCode === '0x') {
    return undefined
  }

  // Compute the keccak256 hash of the bytecode
  const contractCodeHash = keccak256(contractCode as `0x${string}`)

  // Only check 1.3.0 L2 and 1.4.1 L2 versions
  const versionsToCheck: SafeVersion[] = ['1.4.1', '1.3.0']

  // Try to match against each version - L2 only
  for (const version of versionsToCheck) {
    try {
      const deployment = getContractDeployment(version, chainId, 'safeSingletonL2Version')

      if (!deployment || !('deployments' in deployment)) {
        continue
      }

      // Check all deployment types (canonical, eip155, etc.)
      for (const deploymentType of Object.keys(deployment.deployments)) {
        const deploymentInfo =
          deployment.deployments[deploymentType as keyof typeof deployment.deployments]

        if (deploymentInfo && 'codeHash' in deploymentInfo) {
          const deployedCodeHash = deploymentInfo.codeHash

          if (deployedCodeHash === contractCodeHash) {
            // Found a match!
            return { version, isL1: false }
          }
        }
      }
    } catch (e) {
      // If deployment doesn't exist for this version/chain, continue
      continue
    }
  }

  return undefined
}

/**
 * Attempts to determine the Safe version by matching the mastercopy code.
 * This is used as a fallback when the Safe address is not in the safe-deployments package.
 * Only supports 1.3.0 L2 and 1.4.1 L2 mastercopies.
 *
 * @param safeProvider - The SafeProvider instance
 * @param safeAddress - The address of the Safe proxy
 * @param chainId - The chain ID
 * @returns An object containing the matched version, mastercopy address, and L1 flag, or undefined if no match
 */
export async function detectSafeVersionFromMastercopy(
  safeProvider: SafeProvider,
  safeAddress: string,
  chainId: bigint
): Promise<{ version: SafeVersion; mastercopyAddress: string; isL1: boolean } | undefined> {
  try {
    // Get the mastercopy address from the Safe proxy
    const mastercopyAddress = await getMasterCopyAddressFromProxy(safeProvider, safeAddress)

    // Try to match the mastercopy code to a known Safe L2 version
    const matchResult = await matchContractCodeToSafeVersion(
      safeProvider,
      mastercopyAddress,
      chainId
    )

    if (matchResult) {
      return {
        version: matchResult.version,
        mastercopyAddress,
        isL1: matchResult.isL1
      }
    }

    return undefined
  } catch (e) {
    // If any error occurs during detection, return undefined
    return undefined
  }
}
