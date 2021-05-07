import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import dotenv from 'dotenv'
import 'hardhat-deploy'
import 'hardhat-typechain'
import { HardhatUserConfig, HttpNetworkUserConfig } from 'hardhat/types'
import yargs from 'yargs'

const argv = yargs
  .option('network', {
    type: 'string',
    default: 'hardhat',
  })
  .help(false)
  .version(false).argv

dotenv.config()
const { INFURA_KEY, MNEMONIC, PK } = process.env
const DEFAULT_MNEMONIC = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat'

const sharedNetworkConfig: HttpNetworkUserConfig = {}
if (PK) {
  sharedNetworkConfig.accounts = [PK];
} else {
  sharedNetworkConfig.accounts = {
    mnemonic: MNEMONIC || DEFAULT_MNEMONIC,
  }
}

if (['rinkeby'].includes(argv.network) && INFURA_KEY === undefined) {
  throw new Error(
    `Could not find Infura key in env, unable to connect to network ${argv.network}`,
  )
}

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
    },
    rinkeby: {
      ...sharedNetworkConfig,
      url: `https://rinkeby.infura.io/v3/${INFURA_KEY}`,
    }
  },
  namedAccounts: {
    deployer: {
      default: 0
    }
  }
}

export default config
