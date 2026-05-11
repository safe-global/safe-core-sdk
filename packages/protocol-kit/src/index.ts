import Safe from './Safe'
import SafeProvider from './SafeProvider'
import {
  CreateCallBaseContract,
  MultiSendBaseContract,
  MultiSendCallOnlyBaseContract,
  SafeBaseContract,
  SafeProxyFactoryBaseContract,
  SignMessageLibBaseContract
} from './contracts'
import { DEFAULT_SAFE_VERSION } from './contracts/config'
import {
  getCompatibilityFallbackHandlerContract,
  getExtensibleFallbackHandlerContract,
  getCreateCallContract,
  getMultiSendCallOnlyContract,
  getMultiSendContract,
  getSafeProxyFactoryContract,
  getSafeContract,
  getSignMessageLibContract,
  getSafeWebAuthnSignerFactoryContract,
  getSafeWebAuthnSharedSignerContract
} from './contracts/safeDeploymentContracts'
import {
  PREDETERMINED_SALT_NONCE,
  encodeCreateProxyWithNonce,
  encodeSetupCallData,
  predictSafeAddress,
  getPredictedSafeAddressInitCode,
  getSafeAddressFromDeploymentTx
} from './contracts/utils'
import ContractManager from './managers/contractManager'
import {
  EthSafeSignature,
  estimateTxBaseGas,
  estimateTxGas,
  estimateSafeTxGas,
  estimateSafeDeploymentGas,
  extractPasskeyData,
  validateEthereumAddress,
  validateEip3770Address,
  getEip3770NetworkPrefixFromChainId,
  getChainIdFromEip3770NetworkPrefix
} from './utils'
import EthSafeTransaction from './utils/transactions/SafeTransaction'
import EthSafeMessage from './utils/messages/SafeMessage'
import { SafeTransactionOptionalProps } from './utils/transactions/types'
import {
  encodeMultiSendData,
  decodeMultiSendData,
  standardizeSafeTransactionData
} from './utils/transactions/utils'
import {
  getERC20Decimals,
  isGasTokenCompatibleWithHandlePayment,
  createERC20TokenTransferTransaction
} from './utils/erc-20'

import {
  generateSignature,
  generateEIP712Signature,
  buildContractSignature,
  buildSignatureBytes,
  preimageSafeTransactionHash,
  preimageSafeMessageHash,
  generatePreValidatedSignature,
  adjustVInSignature,
  calculateSafeMessageHash,
  calculateSafeTransactionHash
} from './utils/signatures/utils'

import {
  getEip712TxTypes,
  getEip712MessageTypes,
  hashSafeMessage,
  generateTypedData
} from './utils/eip-712'
import { createPasskeyClient } from './utils/passkeys/PasskeyClient'
import getPasskeyOwnerAddress from './utils/passkeys/getPasskeyOwnerAddress'
import { getP256VerifierAddress } from './utils/passkeys/extractPasskeyData'
import generateOnChainIdentifier from './utils/on-chain-tracking/generateOnChainIdentifier'
import { SafeFeature, hasSafeFeature } from './utils/safeVersions'

export {
  estimateTxBaseGas,
  estimateTxGas,
  estimateSafeTxGas,
  estimateSafeDeploymentGas,
  extractPasskeyData,
  getP256VerifierAddress,
  ContractManager,
  CreateCallBaseContract,
  createERC20TokenTransferTransaction,
  DEFAULT_SAFE_VERSION,
  EthSafeSignature,
  MultiSendCallOnlyBaseContract,
  MultiSendBaseContract,
  generateOnChainIdentifier,
  PREDETERMINED_SALT_NONCE,
  SafeBaseContract,
  SafeProxyFactoryBaseContract,
  SafeTransactionOptionalProps,
  SignMessageLibBaseContract,
  encodeCreateProxyWithNonce,
  encodeMultiSendData,
  decodeMultiSendData,
  encodeSetupCallData,
  getCompatibilityFallbackHandlerContract,
  getExtensibleFallbackHandlerContract,
  getCreateCallContract,
  getERC20Decimals,
  getMultiSendCallOnlyContract,
  getMultiSendContract,
  getSafeProxyFactoryContract,
  getSafeContract,
  getSignMessageLibContract,
  getSafeWebAuthnSignerFactoryContract,
  getSafeWebAuthnSharedSignerContract,
  isGasTokenCompatibleWithHandlePayment,
  predictSafeAddress,
  getPredictedSafeAddressInitCode,
  standardizeSafeTransactionData,
  validateEip3770Address,
  validateEthereumAddress,
  generateSignature,
  generateEIP712Signature,
  buildContractSignature,
  buildSignatureBytes,
  preimageSafeTransactionHash,
  preimageSafeMessageHash,
  getEip712TxTypes,
  getEip712MessageTypes,
  getSafeAddressFromDeploymentTx,
  hashSafeMessage,
  generateTypedData,
  SafeProvider,
  createPasskeyClient,
  EthSafeTransaction,
  EthSafeMessage,
  getPasskeyOwnerAddress,
  adjustVInSignature,
  calculateSafeMessageHash,
  calculateSafeTransactionHash,
  generatePreValidatedSignature,
  SafeFeature,
  hasSafeFeature,
  getEip3770NetworkPrefixFromChainId,
  getChainIdFromEip3770NetworkPrefix
}

export * from './types'

export default Safe

declare module 'abitype' {
  export interface Register {
    AddressType: string
  }
}
