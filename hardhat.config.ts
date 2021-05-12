import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-web3'
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
      gas: 100000000,
      accounts: [
        {balance: '100000000000000000000', privateKey: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'},
        {balance: '100000000000000000000', privateKey: '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1'},
        {balance: '100000000000000000000', privateKey: '0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c'},
      ]
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
