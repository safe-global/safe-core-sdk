import { ExtractAbiFunctionNames, narrow } from 'abitype'
import safeWebAuthnSignerFactory_v1_4_1_ContractArtifacts from '../../assets/SafeWebAuthnSignerFactory/v1.4.1/safe_webauthn_signer_factory'
import SafeWebAuthnSignerFactoryBaseContract from '../SafeWebAuthnSignerFactoryBaseContract'
import { ContractFunction } from '../../common/BaseContract'

const safeWebAuthnSignerFactory_v1_4_1_AbiTypes = narrow(
  safeWebAuthnSignerFactory_v1_4_1_ContractArtifacts.abi
)

/**
 * Represents the ABI of the Safe WebAuthn Signer Factory contract version 1.4.1.
 *
 * @type {SafeWebAuthnSignerFactoryContract_v1_4_1_Abi}
 */
export type SafeWebAuthnSignerFactoryContract_v1_4_1_Abi =
  typeof safeWebAuthnSignerFactory_v1_4_1_AbiTypes

/**
 * Represents the function type derived by the given function name from the SafeWebAuthnSignerFactory contract version 1.4.1 ABI.
 *
 * @template ContractFunctionName - The function name, derived from the ABI.
 * @type {SafeWebAuthnSignerFactoryContract_v1_4_1_Function}
 */
export type SafeWebAuthnSignerFactoryContract_v1_4_1_Function<
  ContractFunctionName extends ExtractAbiFunctionNames<SafeWebAuthnSignerFactoryContract_v1_4_1_Abi>
> = ContractFunction<SafeWebAuthnSignerFactoryContract_v1_4_1_Abi, ContractFunctionName>

/**
 * Represents the contract type for a Safe WebAuthn Signer Factory contract version 1.4.1, defining read and write methods.
 * Utilizes the generic SafeWebAuthnSignerFactoryBaseContract with the ABI specific to version 1.4.1.
 *
 * @type {SafeWebAuthnSignerFactoryContract_v1_4_1_Contract}
 */
export type SafeWebAuthnSignerFactoryContract_v1_4_1_Contract =
  SafeWebAuthnSignerFactoryBaseContract<SafeWebAuthnSignerFactoryContract_v1_4_1_Abi>
