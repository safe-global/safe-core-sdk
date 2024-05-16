import { Contract, ZeroAddress, JsonFragment } from 'ethers'
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
import { deployments, ethers } from 'hardhat'
import semverSatisfies from 'semver/functions/satisfies'

// TODO: changue contract por abitype objts

export const getSafeSingleton = async (): Promise<{
  contract: Contract
  abi: JsonFragment | JsonFragment[]
}> => {
  const SafeDeployment = await deployments.get(safeDeployed.name)
  const Safe = await ethers.getContractFactory(safeDeployed.name)
  return {
    contract: Safe.attach(SafeDeployment.address),
    abi: SafeDeployment.abi
  }
}

export const getFactory = async (): Promise<{
  contract: Contract
  abi: JsonFragment | JsonFragment[]
}> => {
  const FactoryDeployment = await deployments.get(proxyFactoryDeployed.name)
  const Factory = await ethers.getContractFactory(proxyFactoryDeployed.name)
  return {
    contract: Factory.attach(FactoryDeployment.address),
    abi: FactoryDeployment.abi
  }
}

export const getSafeTemplate = async (): Promise<Contract> => {
  const randomSaltNonce = Math.floor(Math.random() * 1000000000) + 1
  const singleton = (await getSafeSingleton()).contract
  const factory = (await getFactory()).contract
  const singletonAddress = await singleton.getAddress()
  const template = await factory.createProxyWithNonce.staticCall(
    singletonAddress,
    '0x',
    randomSaltNonce
  )
  await factory
    .createProxyWithNonce(singletonAddress, '0x', randomSaltNonce)
    .then((tx: any) => tx.wait())
  const Safe = await ethers.getContractFactory(safeDeployed.name)
  return Safe.attach(template)
}

export const getSafeWithOwners = async (
  owners: string[],
  threshold?: number,
  fallbackHandler?: string
): Promise<Contract> => {
  const template = await getSafeTemplate()
  if (semverSatisfies(safeVersionDeployed, '<=1.0.0')) {
    await template.setup(
      owners,
      threshold || owners.length,
      ZeroAddress,
      '0x',
      ZeroAddress,
      0,
      ZeroAddress
    )
  } else {
    await template.setup(
      owners,
      threshold || owners.length,
      ZeroAddress,
      '0x',
      fallbackHandler || (await (await getCompatibilityFallbackHandler()).contract.getAddress()),
      ZeroAddress,
      0,
      ZeroAddress
    )
  }
  return template
}

export const getCompatibilityFallbackHandler = async (): Promise<{
  contract: Contract
  abi: JsonFragment | JsonFragment[]
}> => {
  const CompatibilityFallbackHandlerDeployment = await deployments.get(
    compatibilityFallbackHandlerDeployed.name
  )
  const CompatibilityFallbackHandler = await ethers.getContractFactory(
    compatibilityFallbackHandlerDeployed.name
  )
  return {
    contract: CompatibilityFallbackHandler.attach(CompatibilityFallbackHandlerDeployment.address),
    abi: CompatibilityFallbackHandlerDeployment.abi
  }
}

export const getMultiSend = async (): Promise<{
  contract: Contract
  abi: JsonFragment | JsonFragment[]
}> => {
  const MultiSendDeployment = await deployments.get(multiSendDeployed.name)
  const MultiSend = await ethers.getContractFactory(multiSendDeployed.name)
  return {
    contract: MultiSend.attach(MultiSendDeployment.address),
    abi: MultiSendDeployment.abi
  }
}

export const getMultiSendCallOnly = async (): Promise<{
  contract: Contract
  abi: JsonFragment | JsonFragment[]
}> => {
  const MultiSendCallOnlyDeployment = await deployments.get(multiSendCallOnlyDeployed.name)
  const MultiSendCallOnly = await ethers.getContractFactory(multiSendCallOnlyDeployed.name)
  return {
    contract: MultiSendCallOnly.attach(MultiSendCallOnlyDeployment.address),
    abi: MultiSendCallOnlyDeployment.abi
  }
}

export const getSignMessageLib = async (): Promise<{
  contract: Contract
  abi: JsonFragment | JsonFragment[]
}> => {
  const SignMessageLibDeployment = await deployments.get(signMessageLibDeployed.name)
  const SignMessageLib = await ethers.getContractFactory(signMessageLibDeployed.name)
  return {
    contract: SignMessageLib.attach(SignMessageLibDeployment.address),
    abi: SignMessageLibDeployment.abi
  }
}

export const getCreateCall = async (): Promise<{
  contract: Contract
  abi: JsonFragment | JsonFragment[]
}> => {
  const CreateCallDeployment = await deployments.get(createCallDeployed.name)
  const CreateCall = await ethers.getContractFactory(createCallDeployed.name)
  return {
    contract: CreateCall.attach(CreateCallDeployment.address),
    abi: CreateCallDeployment.abi
  }
}

export const getSimulateTxAccessor = async (): Promise<{
  contract: Contract
  abi: JsonFragment | JsonFragment[]
}> => {
  const SimulateTxAccessorDeployment = await deployments.get(simulateTxAccessorDeployed.name)
  const SimulateTxAccessor = await ethers.getContractFactory(simulateTxAccessorDeployed.name)
  return {
    contract: SimulateTxAccessor.attach(SimulateTxAccessorDeployment.address),
    abi: SimulateTxAccessorDeployment.abi
  }
}

export const getDailyLimitModule = async (): Promise<Contract> => {
  const DailyLimitModuleDeployment = await deployments.get('DailyLimitModule')
  const DailyLimitModule = await ethers.getContractFactory('DailyLimitModule')
  return DailyLimitModule.attach(DailyLimitModuleDeployment.address)
}

export const getSocialRecoveryModule = async (): Promise<Contract> => {
  const SocialRecoveryModuleDeployment = await deployments.get('SocialRecoveryModule')
  const SocialRecoveryModule = await ethers.getContractFactory('SocialRecoveryModule')
  return SocialRecoveryModule.attach(SocialRecoveryModuleDeployment.address)
}

export const getStateChannelModule = async (): Promise<Contract> => {
  const StateChannelModuleDeployment = await deployments.get('StateChannelModule')
  const StateChannelModule = await ethers.getContractFactory('StateChannelModule')
  return StateChannelModule.attach(StateChannelModuleDeployment.address)
}

export const getWhiteListModule = async (): Promise<Contract> => {
  const WhiteListModuleDeployment = await deployments.get('WhitelistModule')
  const WhiteListModule = await ethers.getContractFactory('WhitelistModule')
  return WhiteListModule.attach(WhiteListModuleDeployment.address)
}

export const getERC20Mintable = async (): Promise<Contract> => {
  const ERC20MintableDeployment = await deployments.get('ERC20Mintable')
  const ERC20Mintable = await ethers.getContractFactory('ERC20Mintable')
  return ERC20Mintable.attach(ERC20MintableDeployment.address)
}

export const getDebugTransactionGuard = async (): Promise<Contract> => {
  const contractName = semverSatisfies(safeVersionDeployed, '<=1.3.0')
    ? 'DebugTransactionGuard_SV1_3_0'
    : 'DebugTransactionGuard_SV1_4_1'
  const DebugTransactionGuardDeployment = await deployments.get(contractName)
  const DebugTransactionGuard = await ethers.getContractFactory(contractName)
  return DebugTransactionGuard.attach(DebugTransactionGuardDeployment.address)
}

export const getDefaultCallbackHandler = async (): Promise<Contract> => {
  const contractName = semverSatisfies(safeVersionDeployed, '<=1.3.0')
    ? 'DefaultCallbackHandler_SV1_3_0'
    : 'TokenCallbackHandler_SV1_4_1'
  const DefaultCallbackHandlerDeployment = await deployments.get(contractName)
  const DefaultCallbackHandler = await ethers.getContractFactory(contractName)
  return DefaultCallbackHandler.attach(DefaultCallbackHandlerDeployment.address)
}
