import { AddressZero } from '@ethersproject/constants'
import { deployments, ethers } from 'hardhat'
import {
  gnosisSafeDeployed,
  multiSendDeployed,
  proxyFactoryDeployed
} from '../../hardhat/deploy/deploy-contracts'
import {
  GnosisSafe as GnosisSafe_V1_1_1,
  MultiSend as MultiSend_V1_1_1,
  ProxyFactory as ProxyFactory_V1_1_1
} from '../../typechain/src/ethers-v5/v1.1.1'
import { GnosisSafe as GnosisSafe_V1_2_0 } from '../../typechain/src/ethers-v5/v1.2.0/'
import {
  GnosisSafe as GnosisSafe_V1_3_0,
  MultiSend as MultiSend_V1_3_0,
  ProxyFactory as ProxyFactory_V1_3_0
} from '../../typechain/src/ethers-v5/v1.3.0/'
import {
  DailyLimitModule,
  ERC20Mintable,
  SocialRecoveryModule
} from '../../typechain/tests/ethers-v5'

export const getSafeSingleton = async (): Promise<
  GnosisSafe_V1_3_0 | GnosisSafe_V1_2_0 | GnosisSafe_V1_1_1
> => {
  const SafeDeployment = await deployments.get(gnosisSafeDeployed.name)
  const Safe = await ethers.getContractFactory(gnosisSafeDeployed.name)
  return Safe.attach(SafeDeployment.address) as
    | GnosisSafe_V1_3_0
    | GnosisSafe_V1_2_0
    | GnosisSafe_V1_1_1
}

export const getFactory = async (): Promise<ProxyFactory_V1_3_0 | ProxyFactory_V1_1_1> => {
  const FactoryDeployment = await deployments.get(proxyFactoryDeployed.name)
  const Factory = await ethers.getContractFactory(proxyFactoryDeployed.name)
  return Factory.attach(FactoryDeployment.address) as ProxyFactory_V1_3_0 | ProxyFactory_V1_1_1
}

export const getSafeTemplate = async (): Promise<
  GnosisSafe_V1_3_0 | GnosisSafe_V1_2_0 | GnosisSafe_V1_1_1
> => {
  const singleton = await getSafeSingleton()
  const factory = await getFactory()
  const template = await factory.callStatic.createProxy(singleton.address, '0x')
  await factory.createProxy(singleton.address, '0x').then((tx: any) => tx.wait())
  const Safe = await ethers.getContractFactory(gnosisSafeDeployed.name)
  return Safe.attach(template) as GnosisSafe_V1_3_0 | GnosisSafe_V1_2_0 | GnosisSafe_V1_1_1
}

export const getSafeWithOwners = async (
  owners: string[],
  threshold?: number
): Promise<GnosisSafe_V1_3_0 | GnosisSafe_V1_2_0 | GnosisSafe_V1_1_1> => {
  const template = await getSafeTemplate()
  await template.setup(
    owners,
    threshold || owners.length,
    AddressZero,
    '0x',
    AddressZero,
    AddressZero,
    0,
    AddressZero
  )
  return template as GnosisSafe_V1_3_0 | GnosisSafe_V1_2_0 | GnosisSafe_V1_1_1
}

export const getMultiSend = async (): Promise<MultiSend_V1_3_0 | MultiSend_V1_1_1> => {
  const MultiSendDeployment = await deployments.get(multiSendDeployed.name)
  const MultiSend = await ethers.getContractFactory(multiSendDeployed.name)
  return MultiSend.attach(MultiSendDeployment.address) as MultiSend_V1_3_0 | MultiSend_V1_1_1
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
