import { AddressZero } from '@ethersproject/constants'
import {
  compatibilityFallbackHandlerDeployed,
  createCallDeployed,
  multiSendCallOnlyDeployed,
  multiSendDeployed,
  proxyFactoryDeployed,
  safeDeployed,
  safeVersionDeployed,
  signMessageLibDeployed,
  simulateTxAccessorDeployed
} from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import {
  Proxy_factory as SafeProxyFactory_V1_0_0,
  Gnosis_safe as Safe_V1_0_0
} from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.0.0'
import {
  Multi_send as MultiSend_V1_1_1,
  Proxy_factory as SafeProxyFactory_V1_1_1,
  Gnosis_safe as Safe_V1_1_1
} from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.1.1'
import { Gnosis_safe as Safe_V1_2_0 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.2.0'
import {
  Compatibility_fallback_handler as CompatibilityFallbackHandler_V1_3_0,
  Create_call as CreateCall_V1_3_0,
  Multi_send_call_only as MultiSendCallOnly_V1_3_0,
  Multi_send as MultiSend_V1_3_0,
  Proxy_factory as SafeProxyFactory_V1_3_0,
  Gnosis_safe as Safe_V1_3_0,
  Sign_message_lib as SignMessageLib_V1_3_0,
  Simulate_tx_accessor as SimulateTxAccessor_V1_3_0
} from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0'
import {
  Compatibility_fallback_handler as CompatibilityFallbackHandler_V1_4_1,
  Create_call as CreateCall_V1_4_1,
  Multi_send_call_only as MultiSendCallOnly_V1_4_1,
  Multi_send as MultiSend_V1_4_1,
  Safe_proxy_factory as SafeProxyFactory_V1_4_1,
  Safe as Safe_V1_4_1,
  Sign_message_lib as SignMessageLib_V1_4_1,
  Simulate_tx_accessor as SimulateTxAccessor_V1_4_1
} from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.4.1'
import {
  DailyLimitModule,
  ERC20Mintable,
  SocialRecoveryModule
} from '@safe-global/protocol-kit/typechain/tests/ethers-v5/v1.2.0'
import { DebugTransactionGuard } from '@safe-global/protocol-kit/typechain/tests/ethers-v5/v1.3.0'
import { deployments, ethers } from 'hardhat'
import semverSatisfies from 'semver/functions/satisfies'
import { AbiItem } from 'web3-utils'

export const getSafeSingleton = async (): Promise<{
  contract: Safe_V1_4_1 | Safe_V1_3_0 | Safe_V1_2_0 | Safe_V1_1_1 | Safe_V1_0_0
  abi: AbiItem | AbiItem[]
}> => {
  const SafeDeployment = await deployments.get(safeDeployed.name)
  const Safe = await ethers.getContractFactory(safeDeployed.name)
  return {
    contract: Safe.attach(SafeDeployment.address) as
      | Safe_V1_4_1
      | Safe_V1_3_0
      | Safe_V1_2_0
      | Safe_V1_1_1
      | Safe_V1_0_0,
    abi: SafeDeployment.abi
  }
}

export const getFactory = async (): Promise<{
  contract:
    | SafeProxyFactory_V1_4_1
    | SafeProxyFactory_V1_3_0
    | SafeProxyFactory_V1_1_1
    | SafeProxyFactory_V1_0_0
  abi: AbiItem | AbiItem[]
}> => {
  const FactoryDeployment = await deployments.get(proxyFactoryDeployed.name)
  const Factory = await ethers.getContractFactory(proxyFactoryDeployed.name)
  return {
    contract: Factory.attach(FactoryDeployment.address) as
      | SafeProxyFactory_V1_4_1
      | SafeProxyFactory_V1_3_0
      | SafeProxyFactory_V1_1_1
      | SafeProxyFactory_V1_0_0,
    abi: FactoryDeployment.abi
  }
}

export const getSafeTemplate = async (): Promise<
  Safe_V1_4_1 | Safe_V1_3_0 | Safe_V1_2_0 | Safe_V1_1_1 | Safe_V1_0_0
> => {
  const randomSaltNonce = Math.floor(Math.random() * 1000000000) + 1
  const singleton = (await getSafeSingleton()).contract
  const factory = (await getFactory()).contract
  const template = await factory.callStatic.createProxyWithNonce(
    singleton.address,
    '0x',
    randomSaltNonce
  )
  await factory
    .createProxyWithNonce(singleton.address, '0x', randomSaltNonce)
    .then((tx: any) => tx.wait())
  const Safe = await ethers.getContractFactory(safeDeployed.name)
  return Safe.attach(template) as
    | Safe_V1_4_1
    | Safe_V1_3_0
    | Safe_V1_2_0
    | Safe_V1_1_1
    | Safe_V1_0_0
}

export const getSafeWithOwners = async (
  owners: string[],
  threshold?: number,
  fallbackHandler?: string
): Promise<Safe_V1_4_1 | Safe_V1_3_0 | Safe_V1_2_0 | Safe_V1_1_1 | Safe_V1_0_0> => {
  const template = await getSafeTemplate()
  if (semverSatisfies(safeVersionDeployed, '<=1.0.0')) {
    await (template as Safe_V1_0_0).setup(
      owners,
      threshold || owners.length,
      AddressZero,
      '0x',
      AddressZero,
      0,
      AddressZero
    )
  } else {
    await (template as Safe_V1_4_1 | Safe_V1_3_0 | Safe_V1_2_0 | Safe_V1_1_1).setup(
      owners,
      threshold || owners.length,
      AddressZero,
      '0x',
      fallbackHandler || (await getCompatibilityFallbackHandler()).contract.address,
      AddressZero,
      0,
      AddressZero
    )
  }
  return template as Safe_V1_4_1 | Safe_V1_3_0 | Safe_V1_2_0 | Safe_V1_1_1 | Safe_V1_0_0
}

export const getCompatibilityFallbackHandler = async (): Promise<{
  contract: CompatibilityFallbackHandler_V1_4_1 | CompatibilityFallbackHandler_V1_3_0
  abi: AbiItem | AbiItem[]
}> => {
  const CompatibilityFallbackHandlerDeployment = await deployments.get(
    compatibilityFallbackHandlerDeployed.name
  )
  const CompatibilityFallbackHandler = await ethers.getContractFactory(
    compatibilityFallbackHandlerDeployed.name
  )
  return {
    contract: CompatibilityFallbackHandler.attach(
      CompatibilityFallbackHandlerDeployment.address
    ) as CompatibilityFallbackHandler_V1_4_1 | CompatibilityFallbackHandler_V1_3_0,
    abi: CompatibilityFallbackHandlerDeployment.abi
  }
}

export const getMultiSend = async (): Promise<{
  contract: MultiSend_V1_4_1 | MultiSend_V1_3_0 | MultiSend_V1_1_1
  abi: AbiItem | AbiItem[]
}> => {
  const MultiSendDeployment = await deployments.get(multiSendDeployed.name)
  const MultiSend = await ethers.getContractFactory(multiSendDeployed.name)
  return {
    contract: MultiSend.attach(MultiSendDeployment.address) as
      | MultiSend_V1_4_1
      | MultiSend_V1_3_0
      | MultiSend_V1_1_1,
    abi: MultiSendDeployment.abi
  }
}

export const getMultiSendCallOnly = async (): Promise<{
  contract: MultiSendCallOnly_V1_4_1 | MultiSendCallOnly_V1_3_0
  abi: AbiItem | AbiItem[]
}> => {
  const MultiSendCallOnlyDeployment = await deployments.get(multiSendCallOnlyDeployed.name)
  const MultiSendCallOnly = await ethers.getContractFactory(multiSendCallOnlyDeployed.name)
  return {
    contract: MultiSendCallOnly.attach(MultiSendCallOnlyDeployment.address) as
      | MultiSendCallOnly_V1_4_1
      | MultiSendCallOnly_V1_3_0,
    abi: MultiSendCallOnlyDeployment.abi
  }
}

export const getSignMessageLib = async (): Promise<{
  contract: SignMessageLib_V1_4_1 | SignMessageLib_V1_3_0
  abi: AbiItem | AbiItem[]
}> => {
  const SignMessageLibDeployment = await deployments.get(signMessageLibDeployed.name)
  const SignMessageLib = await ethers.getContractFactory(signMessageLibDeployed.name)
  return {
    contract: SignMessageLib.attach(SignMessageLibDeployment.address) as
      | SignMessageLib_V1_4_1
      | SignMessageLib_V1_3_0,
    abi: SignMessageLibDeployment.abi
  }
}

export const getCreateCall = async (): Promise<{
  contract: CreateCall_V1_4_1 | CreateCall_V1_3_0
  abi: AbiItem | AbiItem[]
}> => {
  const CreateCallDeployment = await deployments.get(createCallDeployed.name)
  const CreateCall = await ethers.getContractFactory(createCallDeployed.name)
  return {
    contract: CreateCall.attach(CreateCallDeployment.address) as
      | CreateCall_V1_4_1
      | CreateCall_V1_3_0,
    abi: CreateCallDeployment.abi
  }
}

export const getSimulateTxAccessor = async (): Promise<{
  contract: SimulateTxAccessor_V1_4_1 | SimulateTxAccessor_V1_3_0
  abi: AbiItem | AbiItem[]
}> => {
  const SimulateTxAccessorDeployment = await deployments.get(simulateTxAccessorDeployed.name)
  const SimulateTxAccessor = await ethers.getContractFactory(simulateTxAccessorDeployed.name)
  return {
    contract: SimulateTxAccessor.attach(SimulateTxAccessorDeployment.address) as
      | SimulateTxAccessor_V1_4_1
      | SimulateTxAccessor_V1_3_0,
    abi: SimulateTxAccessorDeployment.abi
  }
}

export const getDailyLimitModule = async (): Promise<DailyLimitModule> => {
  const DailyLimitModuleDeployment = await deployments.get('DailyLimitModule')
  const DailyLimitModule = await ethers.getContractFactory('DailyLimitModule')
  return DailyLimitModule.attach(DailyLimitModuleDeployment.address) as DailyLimitModule
}

export const getSocialRecoveryModule = async (): Promise<SocialRecoveryModule> => {
  const SocialRecoveryModuleDeployment = await deployments.get('SocialRecoveryModule')
  const SocialRecoveryModule = await ethers.getContractFactory('SocialRecoveryModule')
  return SocialRecoveryModule.attach(SocialRecoveryModuleDeployment.address) as SocialRecoveryModule
}

export const getERC20Mintable = async (): Promise<ERC20Mintable> => {
  const ERC20MintableDeployment = await deployments.get('ERC20Mintable')
  const ERC20Mintable = await ethers.getContractFactory('ERC20Mintable')
  return ERC20Mintable.attach(ERC20MintableDeployment.address) as ERC20Mintable
}

export const getDebugTransactionGuard = async (): Promise<DebugTransactionGuard> => {
  const contractName = semverSatisfies(safeVersionDeployed, '<=1.3.0')
    ? 'DebugTransactionGuard_SV1_3_0'
    : 'DebugTransactionGuard_SV1_4_1'
  const DebugTransactionGuardDeployment = await deployments.get(contractName)
  const DebugTransactionGuard = await ethers.getContractFactory(contractName)
  return DebugTransactionGuard.attach(
    DebugTransactionGuardDeployment.address
  ) as DebugTransactionGuard
}

//@ts-expect-error Type not found
export const getDefaultCallbackHandler = async (): Promise<DefaultCallbackHandler> => {
  const contractName = semverSatisfies(safeVersionDeployed, '<=1.3.0')
    ? 'DefaultCallbackHandler_SV1_3_0'
    : 'TokenCallbackHandler_SV1_4_1'
  const DefaultCallbackHandlerDeployment = await deployments.get(contractName)
  const DefaultCallbackHandler = await ethers.getContractFactory(contractName)
  return DefaultCallbackHandler.attach(
    DefaultCallbackHandlerDeployment.address
    //@ts-expect-error Type not found
  ) as DefaultCallbackHandler
}
