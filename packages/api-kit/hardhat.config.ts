import '@nomicfoundation/hardhat-ethers'
import dotenv from 'dotenv'
import { HardhatUserConfig, HttpNetworkUserConfig } from 'hardhat/types'
import yargs from 'yargs'

import 'tsconfig-paths/register'

yargs
  .option('network', {
    type: 'string',
    default: 'hardhat'
  })
  .help(false)
  .version(false).argv

dotenv.config()
const { MNEMONIC, PK, TESTS_PATH } = process.env
const DEFAULT_MNEMONIC =
  'myth like bonus scare over problem client lizard pioneer submit female collect'

const sharedNetworkConfig: HttpNetworkUserConfig = {}
if (PK) {
  sharedNetworkConfig.accounts = [PK]
} else {
  sharedNetworkConfig.accounts = {
    mnemonic: MNEMONIC || DEFAULT_MNEMONIC
  }
}

const config: HardhatUserConfig = {
  defaultNetwork: 'sepolia',
  paths: {
    tests: TESTS_PATH
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      blockGasLimit: 100000000,
      gas: 100000000
    },
    sepolia: {
      ...sharedNetworkConfig,
      url: 'https://sepolia.gateway.tenderly.co'
    }
  },
  //@ts-expect-error Type not found
  compilerOptions: {
    paths: { '^@safe-global/protocol-kit/(.*)$': ['../protocol-kit/src/*'] }
  }
}

export default config
