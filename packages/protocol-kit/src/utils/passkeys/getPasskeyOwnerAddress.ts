import SafeProvider from '../../SafeProvider'
import Safe from '../../Safe'
import { PasskeyArgType } from '../../types'

/**
 * Returns the owner address associated with the specific passkey.
 *
 * @param {Safe} safe The protocol-kit instance of the current Safe
 * @param {PasskeyArgType} passkey The passkey to check the owner address
 * @returns {Promise<string>} Returns the passkey owner address associated with the passkey
 */
async function getPasskeyOwnerAddress(safe: Safe, passkey: PasskeyArgType): Promise<string> {
  const safeVersion = await safe.getContractVersion()

  const safePasskeyProvider = await SafeProvider.init(
    safe.getSafeProvider().provider,
    passkey,
    safeVersion,
    safe.getContractManager().contractNetworks
  )

  const passkeySigner = await safePasskeyProvider.getExternalSigner()

  const passkeyOwnerAddress = await passkeySigner!.account.address

  return passkeyOwnerAddress
}

export default getPasskeyOwnerAddress
