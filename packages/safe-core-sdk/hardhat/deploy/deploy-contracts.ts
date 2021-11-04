import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

type SafeVersion = 'v1.3.0' | 'v1.2.0' | 'v1.1.1'

export const safeVersion = process.env.SAFE_VERSION as SafeVersion

const gnosisSafeContracts = {
  'v1.3.0': { name: 'GnosisSafe_SV1_3_0' },
  'v1.2.0': { name: 'GnosisSafe_SV1_2_0' },
  'v1.1.1': { name: 'GnosisSafe_SV1_1_1' }
}

const proxyFactoryContracts = {
  'v1.3.0': { name: 'ProxyFactory_SV1_3_0' },
  'v1.2.0': { name: 'ProxyFactory_SV1_2_0' },
  'v1.1.1': { name: 'ProxyFactory_SV1_1_1' }
}

const multiSendContracts = {
  'v1.3.0': { name: 'MultiSend_SV1_3_0' },
  'v1.2.0': { name: 'MultiSend_SV1_2_0' },
  'v1.1.1': { name: 'MultiSend_SV1_1_1' }
}

export const gnosisSafeDeployed = gnosisSafeContracts[safeVersion]
export const proxyFactoryDeployed = proxyFactoryContracts[safeVersion]
export const multiSendDeployed = multiSendContracts[safeVersion]

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre
  const { deployer } = await getNamedAccounts()
  const { deploy } = deployments

  console.log(`Deploying Safe contracts ${safeVersion}`)

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
