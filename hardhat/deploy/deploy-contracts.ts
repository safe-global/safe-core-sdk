import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre
  const { deployer } = await getNamedAccounts()
  const { deploy } = deployments

  await deploy('GnosisSafe', {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: true
  })

  await deploy('GnosisSafeProxyFactory', {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: true
  })
}

export default deploy
