import { Contract, JsonFragment } from 'ethers'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import { Address, GetContractReturnType } from 'viem'
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
import { deployments, viem } from 'hardhat'
import semverSatisfies from 'semver/functions/satisfies'

// TODO: changue contract por abitype objts

export const getSafeSingleton = async (): Promise<{
  contract: any
  abi: JsonFragment | JsonFragment[]
}> => {
  const safeDeployment = await deployments.get(safeDeployed.name)
  const safeAddress = safeDeployment.address as Address
  const contract = await viem.getContractAt(safeDeployed.name, safeAddress)
  return {
    contract,
    abi: safeDeployment.abi
  }
}

export const getFactory = async (): Promise<{
  contract: any
  abi: JsonFragment | JsonFragment[]
}> => {
  const factoryDeployment = await deployments.get(proxyFactoryDeployed.name)
  const factoryAddress = factoryDeployment.address as Address
  const contract = await viem.getContractAt(proxyFactoryDeployed.name, factoryAddress)
  return {
    contract,
    abi: factoryDeployment.abi
  }
}

export const getSafeTemplate = async (): Promise<any> => {
  const randomSaltNonce = Math.floor(Math.random() * 1000000000) + 1
  const singleton = (await getSafeSingleton()).contract
  const factory = (await getFactory()).contract
  const singletonAddress = await singleton.address

  const address = (await factory.read.createProxyWithNonce([
    singletonAddress,
    '0x',
    randomSaltNonce
  ])) as Address
  await factory.write.createProxyWithNonce([singletonAddress, '0x', randomSaltNonce])
  return viem.getContractAt(safeDeployed.name, address)
}

export const getSafeWithOwners = async (
  owners: string[],
  threshold?: number,
  fallbackHandler?: string
): Promise<Contract> => {
  const template = await getSafeTemplate()
  if (semverSatisfies(safeVersionDeployed, '<=1.0.0')) {
    await template.write.setup([
      owners,
      threshold || owners.length,
      ZERO_ADDRESS,
      '0x',
      ZERO_ADDRESS,
      0,
      ZERO_ADDRESS
    ])
  } else {
    await template.write.setup([
      owners,
      threshold || owners.length,
      ZERO_ADDRESS,
      '0x',
      fallbackHandler || (await (await getCompatibilityFallbackHandler()).contract.address),
      ZERO_ADDRESS,
      0,
      ZERO_ADDRESS
    ])
  }
  return template
}

export const getCompatibilityFallbackHandler = async (): Promise<{
  contract: GetContractReturnType
  abi: JsonFragment | JsonFragment[]
}> => {
  const compatibilityFallbackHandlerDeployment = await deployments.get(
    compatibilityFallbackHandlerDeployed.name
  )
  const compatibilityFallbackHandlerDeploymentAddress =
    compatibilityFallbackHandlerDeployment.address as Address
  const contract = await viem.getContractAt(
    compatibilityFallbackHandlerDeployed.name,
    compatibilityFallbackHandlerDeploymentAddress
  )
  return {
    contract,
    abi: compatibilityFallbackHandlerDeployment.abi
  }
}

export const getMultiSend = async (): Promise<{
  contract: GetContractReturnType
  abi: JsonFragment | JsonFragment[]
}> => {
  const multiSendDeployment = await deployments.get(multiSendDeployed.name)
  const multiSendAddress = multiSendDeployment.address as Address
  const contract = await viem.getContractAt(multiSendDeployed.name, multiSendAddress)
  return {
    contract,
    abi: multiSendDeployment.abi
  }
}

export const getMultiSendCallOnly = async (): Promise<{
  contract: GetContractReturnType
  abi: JsonFragment | JsonFragment[]
}> => {
  const multiSendCallOnlyDeployment = await deployments.get(multiSendCallOnlyDeployed.name)
  const multiSendAddress = multiSendCallOnlyDeployment.address as Address
  const contract = await viem.getContractAt(multiSendCallOnlyDeployed.name, multiSendAddress)
  return {
    contract,
    abi: multiSendCallOnlyDeployment.abi
  }
}

export const getSignMessageLib = async (): Promise<{
  contract: GetContractReturnType
  abi: JsonFragment | JsonFragment[]
}> => {
  const signMessageLibDeployment = await deployments.get(signMessageLibDeployed.name)
  const signMessageLibAddress = signMessageLibDeployment.address as Address
  const contract = await viem.getContractAt(signMessageLibDeployed.name, signMessageLibAddress)
  return {
    contract,
    abi: signMessageLibDeployment.abi
  }
}

export const getCreateCall = async (): Promise<{
  contract: GetContractReturnType
  abi: JsonFragment | JsonFragment[]
}> => {
  const createCallDeployment = await deployments.get(createCallDeployed.name)
  const createCallAddress = createCallDeployment.address as Address
  const contract = await viem.getContractAt(createCallDeployed.name, createCallAddress)
  return {
    contract,
    abi: createCallDeployment.abi
  }
}

export const getSimulateTxAccessor = async (): Promise<{
  contract: GetContractReturnType
  abi: JsonFragment | JsonFragment[]
}> => {
  const simulateTxAccessorDeployment = await deployments.get(simulateTxAccessorDeployed.name)
  const simulateTxAccessorAddress = simulateTxAccessorDeployment.address as Address
  const contract = await viem.getContractAt(
    simulateTxAccessorDeployed.name,
    simulateTxAccessorAddress
  )
  return {
    contract,
    abi: simulateTxAccessorDeployment.abi
  }
}

export const getDailyLimitModule = async (): Promise<GetContractReturnType> => {
  const dailyLimitModuleDeployment = await deployments.get('DailyLimitModule')
  const dailyLimitModuleAddress = dailyLimitModuleDeployment.address as Address
  return await viem.getContractAt('DailyLimitModule', dailyLimitModuleAddress)
}

export const getSocialRecoveryModule = async (): Promise<GetContractReturnType> => {
  const socialRecoveryModuleDeployment = await deployments.get('SocialRecoveryModule')
  const socialRecoveryModuleAddress = socialRecoveryModuleDeployment.address as Address
  return await viem.getContractAt('SocialRecoveryModule', socialRecoveryModuleAddress)
}

export const getStateChannelModule = async (): Promise<GetContractReturnType> => {
  const stateChannelModuleDeployment = await deployments.get('StateChannelModule')
  const stateChannelModuleAddress = stateChannelModuleDeployment.address as Address
  return await viem.getContractAt('StateChannelModule', stateChannelModuleAddress)
}

export const getWhiteListModule = async (): Promise<GetContractReturnType> => {
  const whiteListModuleDeployment = await deployments.get('WhitelistModule')
  const whiteListModuleAddress = whiteListModuleDeployment.address as Address
  return await viem.getContractAt('WhitelistModule', whiteListModuleAddress)
}

export const getERC20Mintable = async (): Promise<GetContractReturnType> => {
  const eRC20MintableDeployment = await deployments.get('ERC20Mintable')
  const eRC20MintableAddress = eRC20MintableDeployment.address as Address
  return await viem.getContractAt('ERC20Mintable', eRC20MintableAddress)
}

export const getDebugTransactionGuard = async (): Promise<GetContractReturnType> => {
  const contractName = semverSatisfies(safeVersionDeployed, '<=1.3.0')
    ? 'DebugTransactionGuard_SV1_3_0'
    : 'DebugTransactionGuard_SV1_4_1'
  const debugTransactionGuardDeployment = await deployments.get(contractName)
  const debugTransactionGuardAddress = debugTransactionGuardDeployment.address as Address
  return await viem.getContractAt(contractName, debugTransactionGuardAddress)
}

export const getDefaultCallbackHandler = async (): Promise<GetContractReturnType> => {
  const contractName = semverSatisfies(safeVersionDeployed, '<=1.3.0')
    ? 'DefaultCallbackHandler_SV1_3_0'
    : 'TokenCallbackHandler_SV1_4_1'
  const defaultCallbackHandlerDeployment = await deployments.get(contractName)
  const defaultCallbackHandlerAddress = defaultCallbackHandlerDeployment.address as Address
  return await viem.getContractAt(contractName, defaultCallbackHandlerAddress)
}
