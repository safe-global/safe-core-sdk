import { ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import { GetContractReturnType, Abi, WalletClient } from 'viem'
import {
  compatibilityFallbackHandlerDeployed,
  createCallDeployed,
  multiSendCallOnlyDeployed,
  multiSendDeployed,
  proxyFactoryDeployed,
  safeDeployed,
  safeVersionDeployed,
  safeWebAuthnSharedSignerDeployed,
  safeWebAuthnSignerFactoryDeployed,
  signMessageLibDeployed,
  simulateTxAccessorDeployed
} from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import { deployments, viem } from 'hardhat'
import semverSatisfies from 'semver/functions/satisfies'
import { getDeployer, waitTransactionReceipt } from './transactions'

export const getSafeSingleton = async (): Promise<{
  contract: GetContractReturnType
  abi: Abi
}> => {
  const safeDeployment = await deployments.get(safeDeployed.name)
  const contract = await viem.getContractAt(safeDeployed.name, safeDeployment.address)
  return {
    contract,
    abi: safeDeployment.abi
  }
}

export const getFactory = async (): Promise<{
  contract: GetContractReturnType<Abi, WalletClient>
  abi: Abi
}> => {
  const factoryDeployment = await deployments.get(proxyFactoryDeployed.name)
  const factoryAddress = factoryDeployment.address
  const contract = await viem.getContractAt(proxyFactoryDeployed.name, factoryAddress, {
    client: { wallet: await getDeployer() }
  })
  return {
    contract,
    abi: factoryDeployment.abi
  }
}

export const getSafeTemplate = async (): Promise<GetContractReturnType<Abi, WalletClient>> => {
  const randomSaltNonce = Math.floor(Math.random() * 1000000000) + 1
  const singleton = (await getSafeSingleton()).contract
  const factory = (await getFactory()).contract
  const singletonAddress = singleton.address

  const { result } = await factory.simulate.createProxyWithNonce([
    singletonAddress,
    '0x',
    randomSaltNonce
  ])
  const hash = await factory.write.createProxyWithNonce([singletonAddress, '0x', randomSaltNonce])
  await waitTransactionReceipt(hash)
  return viem.getContractAt(safeDeployed.name, result)
}

export const getSafeWithOwners = async (
  owners: string[],
  threshold?: number,
  fallbackHandler?: string
): Promise<GetContractReturnType<Abi, WalletClient>> => {
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
      fallbackHandler || (await getCompatibilityFallbackHandler()).contract.address,
      ZERO_ADDRESS,
      0,
      ZERO_ADDRESS
    ])
  }
  return template
}

export const getCompatibilityFallbackHandler = async (): Promise<{
  contract: GetContractReturnType
  abi: Abi
}> => {
  const compatibilityFallbackHandlerDeployment = await deployments.get(
    compatibilityFallbackHandlerDeployed.name
  )
  const compatibilityFallbackHandlerDeploymentAddress =
    compatibilityFallbackHandlerDeployment.address

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
  abi: Abi
}> => {
  const multiSendDeployment = await deployments.get(multiSendDeployed.name)
  const multiSendAddress = multiSendDeployment.address
  const contract = await viem.getContractAt(multiSendDeployed.name, multiSendAddress)
  return {
    contract,
    abi: multiSendDeployment.abi
  }
}

export const getMultiSendCallOnly = async (): Promise<{
  contract: GetContractReturnType
  abi: Abi
}> => {
  const multiSendCallOnlyDeployment = await deployments.get(multiSendCallOnlyDeployed.name)
  const multiSendAddress = multiSendCallOnlyDeployment.address
  const contract = await viem.getContractAt(multiSendCallOnlyDeployed.name, multiSendAddress)
  return {
    contract,
    abi: multiSendCallOnlyDeployment.abi
  }
}

export const getSignMessageLib = async (): Promise<{
  contract: GetContractReturnType
  abi: Abi
}> => {
  const signMessageLibDeployment = await deployments.get(signMessageLibDeployed.name)
  const signMessageLibAddress = signMessageLibDeployment.address
  const contract = await viem.getContractAt(signMessageLibDeployed.name, signMessageLibAddress)
  return {
    contract,
    abi: signMessageLibDeployment.abi
  }
}

export const getCreateCall = async (): Promise<{
  contract: GetContractReturnType
  abi: Abi
}> => {
  const createCallDeployment = await deployments.get(createCallDeployed.name)
  const createCallAddress = createCallDeployment.address
  const contract = await viem.getContractAt(createCallDeployed.name, createCallAddress)
  return {
    contract,
    abi: createCallDeployment.abi
  }
}

export const getSimulateTxAccessor = async (): Promise<{
  contract: GetContractReturnType
  abi: Abi
}> => {
  const simulateTxAccessorDeployment = await deployments.get(simulateTxAccessorDeployed.name)
  const simulateTxAccessorAddress = simulateTxAccessorDeployment.address
  const contract = await viem.getContractAt(
    simulateTxAccessorDeployed.name,
    simulateTxAccessorAddress
  )
  return {
    contract,
    abi: simulateTxAccessorDeployment.abi
  }
}

export const getSafeWebAuthnSignerFactory = async (): Promise<{
  contract: GetContractReturnType
  abi: Abi
}> => {
  const safeWebAuthnSignerFactoryDeployment = await deployments.get(
    safeWebAuthnSignerFactoryDeployed.name
  )
  const safeWebAuthnSignerFactoryAddress = safeWebAuthnSignerFactoryDeployment.address
  const contract = await viem.getContractAt(
    proxyFactoryDeployed.name,
    safeWebAuthnSignerFactoryAddress,
    {
      client: { wallet: await getDeployer() }
    }
  )
  return {
    contract,
    abi: safeWebAuthnSignerFactoryDeployment.abi
  }
}

export const getSafeWebAuthnSharedSigner = async (): Promise<{
  contract: GetContractReturnType
  abi: Abi
}> => {
  const safeWebAuthnSharedSignerDeployment = await deployments.get(
    safeWebAuthnSharedSignerDeployed.name
  )

  return {
    contract: await viem.getContractAt(
      safeWebAuthnSharedSignerDeployed.name,
      safeWebAuthnSharedSignerDeployment.address
    ),
    abi: safeWebAuthnSharedSignerDeployment.abi
  }
}

export const getWebAuthnContract = async (): Promise<GetContractReturnType<Abi>> => {
  const webAuthnContractDeployment = await deployments.get('WebAuthnContract')
  const dailyLimitModuleAddress = webAuthnContractDeployment.address
  return await viem.getContractAt('WebAuthnContract', dailyLimitModuleAddress)
}

export const getDailyLimitModule = async (): Promise<GetContractReturnType<Abi>> => {
  const dailyLimitModuleDeployment = await deployments.get('DailyLimitModule')
  const dailyLimitModuleAddress = dailyLimitModuleDeployment.address
  return await viem.getContractAt('DailyLimitModule', dailyLimitModuleAddress)
}

export const getSocialRecoveryModule = async (): Promise<GetContractReturnType<Abi>> => {
  const socialRecoveryModuleDeployment = await deployments.get('SocialRecoveryModule')
  const socialRecoveryModuleAddress = socialRecoveryModuleDeployment.address
  return await viem.getContractAt('SocialRecoveryModule', socialRecoveryModuleAddress)
}

export const getStateChannelModule = async (): Promise<GetContractReturnType<Abi>> => {
  const stateChannelModuleDeployment = await deployments.get('StateChannelModule')
  const stateChannelModuleAddress = stateChannelModuleDeployment.address
  return await viem.getContractAt('StateChannelModule', stateChannelModuleAddress)
}

export const getWhiteListModule = async (): Promise<GetContractReturnType<Abi>> => {
  const whiteListModuleDeployment = await deployments.get('WhitelistModule')
  const whiteListModuleAddress = whiteListModuleDeployment.address
  return await viem.getContractAt('WhitelistModule', whiteListModuleAddress)
}

export const getERC20Mintable = async (): Promise<GetContractReturnType<Abi, WalletClient>> => {
  const eRC20MintableDeployment = await deployments.get('ERC20Mintable')
  const eRC20MintableAddress = eRC20MintableDeployment.address
  return await viem.getContractAt('ERC20Mintable', eRC20MintableAddress, {
    client: { wallet: await getDeployer() }
  })
}

export const getDebugTransactionGuard = async (): Promise<GetContractReturnType<Abi>> => {
  const contractName = semverSatisfies(safeVersionDeployed, '<=1.3.0')
    ? 'DebugTransactionGuard_SV1_3_0'
    : 'DebugTransactionGuard_SV1_4_1'
  const debugTransactionGuardDeployment = await deployments.get(contractName)
  const debugTransactionGuardAddress = debugTransactionGuardDeployment.address
  return await viem.getContractAt(contractName, debugTransactionGuardAddress)
}

export const getDefaultCallbackHandler = async (): Promise<GetContractReturnType<Abi>> => {
  const contractName = semverSatisfies(safeVersionDeployed, '<=1.3.0')
    ? 'DefaultCallbackHandler_SV1_3_0'
    : 'TokenCallbackHandler_SV1_4_1'
  const defaultCallbackHandlerDeployment = await deployments.get(contractName)
  const defaultCallbackHandlerAddress = defaultCallbackHandlerDeployment.address
  return await viem.getContractAt(contractName, defaultCallbackHandlerAddress)
}
