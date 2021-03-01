import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-deploy'
import 'hardhat-typechain'
import { HardhatUserConfig } from 'hardhat/types'

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      { version: '0.5.17' }
    ]
  },
  paths: {
    artifacts: 'artifacts',
    deploy: 'hardhat/deploy',
    sources: 'contracts',
    tests: 'tests'
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      blockGasLimit: 100000000,
      gas: 100000000
    }
  },
  namedAccounts: {
    deployer: 0,
  }
}

export default config
