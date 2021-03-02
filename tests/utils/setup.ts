import { AddressZero } from '@ethersproject/constants'
import { deployments, ethers } from 'hardhat'

export const getSafeSingleton = async () => {
  const SafeDeployment = await deployments.get('GnosisSafe')
  const Safe = await ethers.getContractFactory('GnosisSafe')
  return Safe.attach(SafeDeployment.address)
}

export const getFactory = async () => {
  const FactoryDeployment = await deployments.get('GnosisSafeProxyFactory')
  const Factory = await ethers.getContractFactory('GnosisSafeProxyFactory')
  return Factory.attach(FactoryDeployment.address)
}

export const getSafeTemplate = async () => {
  const singleton = await getSafeSingleton()
  const factory = await getFactory()
  const template = await factory.callStatic.createProxy(singleton.address, '0x')
  await factory.createProxy(singleton.address, '0x').then((tx: any) => tx.wait())
  const Safe = await ethers.getContractFactory('GnosisSafe')
  return Safe.attach(template)
}

export const getSafeWithOwners = async (owners: string[], threhsold?: number) => {
  const template = await getSafeTemplate()
  await template.setup(
    owners,
    threhsold || owners.length,
    AddressZero,
    '0x',
    AddressZero,
    AddressZero,
    0,
    AddressZero
  )
  return template
}
