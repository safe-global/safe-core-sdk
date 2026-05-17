import {
  PasskeyArgType,
  SafeWebAuthnSharedSignerContractImplementationType
} from '@safe-global/protocol-kit/types'
import { getDefaultFCLP256VerifierAddress } from './extractPasskeyData'
import { asHex } from '@safe-global/protocol-kit/utils/types'

/**
 * Returns true if the passkey signer is a shared signer
 * @returns {Promise<boolean>} A promise that resolves to the signer's address.
 */
async function isSharedSigner(
  passkey: PasskeyArgType,
  safeWebAuthnSharedSignerContract: SafeWebAuthnSharedSignerContractImplementationType,
  safeAddress: string,
  owners: string[],
  chainId: string
): Promise<boolean> {
  const sharedSignerContractAddress = safeWebAuthnSharedSignerContract.contractAddress

  // is a shared signer if the shared signer contract address is present in the owners and its configured in the Safe slot
  if (safeAddress && owners.includes(sharedSignerContractAddress)) {
    const [sharedSignerSlot] = await safeWebAuthnSharedSignerContract.getConfiguration([
      asHex(safeAddress)
    ])

    const { x, y, verifiers } = sharedSignerSlot

    const verifierAddress =
      passkey.customVerifierAddress || getDefaultFCLP256VerifierAddress(chainId)

    // P256.Verifiers (uint176) packs two values: upper 16 bits = precompile slot
    // (e.g. 0x0100 for EIP-7951), lower 160 bits = fallback verifier address.
    // Simple encoding leaves the upper bits at zero. Either way, ownership is
    // defined by (x, y) + fallback verifier — the precompile is a routing
    // optimisation — so we mask to the lower 160 bits before comparing.
    const MASK_160 = (1n << 160n) - 1n
    // viem returns bigint; ethers v5 / mocks may return string or BigNumber.
    const verifiersBig = typeof verifiers === 'bigint' ? verifiers : BigInt(verifiers)
    const expectedVerifier = BigInt(verifierAddress)

    const isSharedSigner =
      BigInt(passkey.coordinates.x) === x &&
      BigInt(passkey.coordinates.y) === y &&
      (verifiersBig & MASK_160) === expectedVerifier

    return isSharedSigner
  }

  return false
}

export default isSharedSigner
