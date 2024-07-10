import { Abi } from 'abitype'
import BaseContract, { EstimateGasFunction } from '../common/BaseContract'

/**
 * Represents the base contract type for a Safe WebAuthn Shared Signer contract.
 *
 * @template SafeWebAuthnSharedSignerContractAbi - The ABI of the Safe WebAuthn Shared Signer contract.
 * @type {SafeWebAuthnSahredSignerBaseContract}
 */
export type SafeWebAuthnSharedSignerBaseContract<SafeWebAuthnSharedSignerContractAbi extends Abi> =
  BaseContract<SafeWebAuthnSharedSignerContractAbi> & {
    estimateGas: EstimateGasFunction<SafeWebAuthnSharedSignerContractAbi>
  }

export default SafeWebAuthnSharedSignerBaseContract
