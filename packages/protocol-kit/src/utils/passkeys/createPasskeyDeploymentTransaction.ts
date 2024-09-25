import { Hex } from 'viem'

import Safe from '@safe-global/protocol-kit/Safe'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { PasskeyArgType, PasskeyClient } from '@safe-global/protocol-kit/types'

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
): Promise<{ to: string; value: string; data: Hex }> {
  const safeVersion = safe.getContractVersion()
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

  const passkeySigner = (await safePasskeyProvider.getExternalSigner()) as PasskeyClient
  const passkeyAddress = passkeySigner!.account.address

  const isPasskeyDeployed = await safe.getSafeProvider().isContractDeployed(passkeyAddress)

  if (isPasskeyDeployed) {
    throw new Error('Passkey Signer contract already deployed')
  }

  return passkeySigner.createDeployTxRequest()
}

export default createPasskeyDeploymentTransaction
