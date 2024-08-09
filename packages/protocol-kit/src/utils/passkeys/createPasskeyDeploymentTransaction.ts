import Safe from '../../Safe'
import { PasskeyArgType } from '../../types'
import { EMPTY_DATA } from '../constants'
import SafeProvider from '../../SafeProvider'
import PasskeySigner from './PasskeySigner'

/**
 * Creates the deployment transaction to create a passkey signer.
 *
 * @param {Safe} safe The protocol-kit instance of the current Safe
 * @param {PasskeyArgType} passkey The passkey object
 * @returns {Promise<{ to: string; value: string; data: string; }>} The deployment transaction to create a passkey signer.
 */
async function createPasskeyDeploymentTransaction(
  safe: Safe,
  passkey: PasskeyArgType
): Promise<{ to: string; value: string; data: string }> {
  const safeVersion = await safe.getContractVersion()
  const safeAddress = await safe.getAddress()
  const owners = await safe.getOwners()

  const safePasskeyProvider = await SafeProvider.init(
    safe.getSafeProvider().provider,
    passkey,
    safeVersion,
    safe.getContractManager().contractNetworks,
    safeAddress,
    owners
  )

  const passkeySigner = (await safePasskeyProvider.getExternalSigner()) as PasskeySigner
  const passkeyAddress = await passkeySigner!.getAddress()
  const provider = safe.getSafeProvider().getExternalProvider()

  const isPasskeyDeployed = (await provider.getCode(passkeyAddress)) !== EMPTY_DATA

  if (isPasskeyDeployed) {
    throw new Error('Passkey Signer contract already deployed')
  }

  const passkeySignerDeploymentTransaction = {
    to: await passkeySigner.safeWebAuthnSignerFactoryContract.getAddress(),
    value: '0',
    data: passkeySigner.encodeCreateSigner()
  }

  return passkeySignerDeploymentTransaction
}

export default createPasskeyDeploymentTransaction
