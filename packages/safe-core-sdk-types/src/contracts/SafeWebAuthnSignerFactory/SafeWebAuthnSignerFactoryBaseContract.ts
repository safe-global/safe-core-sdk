import { Abi } from 'abitype'
import BaseContract, { EstimateGasFunction } from '../common/BaseContract'

/**
 * Represents the base contract type for a Safe WebAuthn Signer Factory contract.
 *
 * @template SafeWebAuthnSignerFactoryContractAbi - The ABI of the Safe WebAuthn Signer Factory contract.
 * @type {SafeWebAuthnSignerFactoryBaseContract}
 */
export type SafeWebAuthnSignerFactoryBaseContract<
  SafeWebAuthnSignerFactoryContractAbi extends Abi
> = BaseContract<SafeWebAuthnSignerFactoryContractAbi> & {
  estimateGas: EstimateGasFunction<SafeWebAuthnSignerFactoryContractAbi>
}

export default SafeWebAuthnSignerFactoryBaseContract
