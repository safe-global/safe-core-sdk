import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export const safeVersionDeployed = process.env.SAFE_VERSION as SafeVersion

const gnosisSafeContracts = {
  '1.3.0': { name: 'GnosisSafe_SV1_3_0' },
  '1.2.0': { name: 'GnosisSafe_SV1_2_0' },
  '1.1.1': { name: 'GnosisSafe_SV1_1_1' },
  '1.0.0': { name: 'GnosisSafe_SV1_0_0' }
}

const proxyFactoryContracts = {
  '1.3.0': { name: 'ProxyFactory_SV1_3_0' },
  '1.2.0': { name: 'ProxyFactory_SV1_2_0' },
  '1.1.1': { name: 'ProxyFactory_SV1_1_1' },
  '1.0.0': { name: 'ProxyFactory_SV1_0_0' }
}

const multiSendContracts = {
  '1.3.0': { name: 'MultiSend_SV1_3_0' },
  '1.2.0': { name: 'MultiSend_SV1_2_0' },
  '1.1.1': { name: 'MultiSend_SV1_2_0' },
  '1.0.0': { name: 'MultiSend_SV1_2_0' }
}

const multiSendCallOnlyContracts = {
  '1.3.0': { name: 'MultiSendCallOnly_SV1_3_0' },
  '1.2.0': { name: 'MultiSendCallOnly_SV1_3_0' },
  '1.1.1': { name: 'MultiSendCallOnly_SV1_3_0' },
  '1.0.0': { name: 'MultiSendCallOnly_SV1_3_0' }
}

const compatibilityFallbackHandlerContracts = {
  '1.3.0': { name: 'CompatibilityFallbackHandler_SV1_3_0' },
  '1.2.0': { name: 'CompatibilityFallbackHandler_SV1_3_0' },
  '1.1.1': { name: 'CompatibilityFallbackHandler_SV1_3_0' },
  '1.0.0': { name: 'CompatibilityFallbackHandler_SV1_3_0' }
}

const signMessageLibContracts = {
  '1.3.0': { name: 'SignMessageLib_SV1_3_0' },
  '1.2.0': { name: 'SignMessageLib_SV1_3_0' },
  '1.1.1': { name: 'SignMessageLib_SV1_3_0' },
  '1.0.0': { name: 'SignMessageLib_SV1_3_0' }
}

const createCallContracts = {
  '1.3.0': { name: 'CreateCall_SV1_3_0' },
  '1.2.0': { name: 'CreateCall_SV1_3_0' },
  '1.1.1': { name: 'CreateCall_SV1_3_0' },
  '1.0.0': { name: 'CreateCall_SV1_3_0' }
}

export const gnosisSafeDeployed = gnosisSafeContracts[safeVersionDeployed]
export const proxyFactoryDeployed = proxyFactoryContracts[safeVersionDeployed]
export const multiSendDeployed = multiSendContracts[safeVersionDeployed]
export const multiSendCallOnlyDeployed = multiSendCallOnlyContracts[safeVersionDeployed]
export const compatibilityFallbackHandlerDeployed =
  compatibilityFallbackHandlerContracts[safeVersionDeployed]
export const signMessageLibDeployed = signMessageLibContracts[safeVersionDeployed]
export const createCallDeployed = createCallContracts[safeVersionDeployed]

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

  await deploy(multiSendCallOnlyDeployed.name, {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: true
  })

  await deploy(signMessageLibDeployed.name, {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: true
  })

  await deploy(createCallDeployed.name, {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: true
  })

  await deploy(compatibilityFallbackHandlerDeployed.name, {
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

  await deploy('DebugTransactionGuard', {
    from: deployer,
    args: [],
    log: true
  })

  await deploy('DefaultCallbackHandler_SV1_3_0', {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: true
  })
}

export default deploy
