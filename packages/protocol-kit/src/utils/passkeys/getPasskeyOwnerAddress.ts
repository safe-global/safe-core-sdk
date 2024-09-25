import Safe from '@safe-global/protocol-kit/Safe'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { PasskeyArgType } from '@safe-global/protocol-kit/types'

/**
 * Returns the owner address associated with the specific passkey.
 *
 * @param {Safe} safe The protocol-kit instance of the current Safe
 * @param {PasskeyArgType} passkey The passkey to check the owner address
 * @returns {Promise<string>} Returns the passkey owner address associated with the passkey
 */
async function getPasskeyOwnerAddress(safe: Safe, passkey: PasskeyArgType): Promise<string> {
  const safeVersion = safe.getContractVersion()
  const safeAddress = await safe.getAddress()
  const owners = await safe.getOwners()

  const safePasskeyProvider = await SafeProvider.init({
    provider: safe.getSafeProvider().provider,
    signer: passkey,
    safeVersion,
    contractNetworks: safe.getContractManager().contractNetworks,
    safeAddress,
    owners
  })

  const passkeySigner = await safePasskeyProvider.getExternalSigner()

  const passkeyOwnerAddress = passkeySigner!.account.address

  return passkeyOwnerAddress
}

export default getPasskeyOwnerAddress
