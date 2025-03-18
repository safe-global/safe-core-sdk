import Safe from '@safe-global/protocol-kit/Safe'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { PasskeyArgType } from '@safe-global/protocol-kit/types'
import { Address } from '@safe-global/types-kit'

/**
 * Returns the owner address associated with the specific passkey.
 *
 * @param {Safe} safe The protocol-kit instance of the current Safe
 * @param {PasskeyArgType} passkey The passkey to check the owner address
 * @returns {Promise<Address>} Returns the passkey owner address associated with the passkey
 */
async function getPasskeyOwnerAddress(safe: Safe, passkey: PasskeyArgType): Promise<Address> {
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
