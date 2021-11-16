import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

type SafeVersion = '1.3.0' | '1.2.0' | '1.1.1'

export const safeVersionDeployed = process.env.SAFE_VERSION as SafeVersion

const gnosisSafeContracts = {
  '1.3.0': { name: 'GnosisSafe_SV1_3_0' },
  '1.2.0': { name: 'GnosisSafe_SV1_2_0' },
  '1.1.1': { name: 'GnosisSafe_SV1_1_1' }
}

const proxyFactoryContracts = {
  '1.3.0': { name: 'ProxyFactory_SV1_3_0' },
  '1.2.0': { name: 'ProxyFactory_SV1_2_0' },
  '1.1.1': { name: 'ProxyFactory_SV1_1_1' }
}

const multiSendContracts = {
  '1.3.0': { name: 'MultiSend_SV1_3_0' },
  '1.2.0': { name: 'MultiSend_SV1_2_0' },
  '1.1.1': { name: 'MultiSend_SV1_1_1' }
}

export const gnosisSafeDeployed = gnosisSafeContracts[safeVersionDeployed]
export const proxyFactoryDeployed = proxyFactoryContracts[safeVersionDeployed]
export const multiSendDeployed = multiSendContracts[safeVersionDeployed]

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  const { deployments, getNamedAccounts } = hre
  const { deployer } = await getNamedAccounts()
  const { deploy } = deployments

  await deploy(gnosisSafeDeployed.name, {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: true
  })

  await deploy(proxyFactoryDeployed.name, {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: true
  })

  await deploy(multiSendDeployed.name, {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: true
  })

  await deploy('DailyLimitModule', {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: true
  })

  await deploy('SocialRecoveryModule', {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: true
  })

  await deploy('ERC20Mintable', {
    from: deployer,
    args: [],
    log: true
  })
}

export default deploy
