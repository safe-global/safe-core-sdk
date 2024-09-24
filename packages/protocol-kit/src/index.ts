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
  getPredictedSafeAddressInitCode
} from './contracts/utils'
import ContractManager from './managers/contractManager'
import SafeFactory from './SafeFactory'
import {
  EthSafeSignature,
  estimateTxBaseGas,
  estimateTxGas,
  estimateSafeTxGas,
  estimateSafeDeploymentGas,
  extractPasskeyCoordinates,
  extractPasskeyData,
  validateEthereumAddress,
  validateEip3770Address
} from './utils'
import EthSafeTransaction from './utils/transactions/SafeTransaction'
import EthSafeMessage from './utils/messages/SafeMessage'
import { SafeTransactionOptionalProps } from './utils/transactions/types'
import { encodeMultiSendData, standardizeSafeTransactionData } from './utils/transactions/utils'
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
  preimageSafeMessageHash
} from './utils/signatures/utils'

import {
  getEip712TxTypes,
  getEip712MessageTypes,
  hashSafeMessage,
  generateTypedData
} from './utils/eip-712'
import { createPasskeyClient } from './utils/passkeys/PasskeyClient'
import getPasskeyOwnerAddress from './utils/passkeys/getPasskeyOwnerAddress'

export {
  estimateTxBaseGas,
  estimateTxGas,
  estimateSafeTxGas,
  estimateSafeDeploymentGas,
  extractPasskeyData,
  extractPasskeyCoordinates,
  ContractManager,
  CreateCallBaseContract,
  createERC20TokenTransferTransaction,
  DEFAULT_SAFE_VERSION,
  EthSafeSignature,
  MultiSendCallOnlyBaseContract,
  MultiSendBaseContract,
  PREDETERMINED_SALT_NONCE,
  SafeBaseContract,
  SafeFactory,
  SafeProxyFactoryBaseContract,
  SafeTransactionOptionalProps,
  SignMessageLibBaseContract,
  encodeCreateProxyWithNonce,
  encodeMultiSendData,
  encodeSetupCallData,
  getCompatibilityFallbackHandlerContract,
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
  hashSafeMessage,
  generateTypedData,
  SafeProvider,
  createPasskeyClient,
  EthSafeTransaction,
  EthSafeMessage,
  getPasskeyOwnerAddress
}

export * from './types'

export default Safe

declare module 'abitype' {
  export interface Register {
    AddressType: string
  }
}
