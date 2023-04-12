import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-web3'
import dotenv from 'dotenv'
import { HardhatUserConfig, HttpNetworkUserConfig } from 'hardhat/types'
import yargs from 'yargs'

import 'tsconfig-paths/register'

const argv = yargs
  .option('network', {
    type: 'string',
    default: 'hardhat'
  })
  .help(false)
  .version(false).argv

dotenv.config()
const { INFURA_KEY, MNEMONIC, PK, TESTS_PATH } = process.env
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

if (['goerli'].includes(argv.network) && INFURA_KEY === undefined) {
  throw new Error(`Could not find Infura key in env, unable to connect to network ${argv.network}`)
}

const config: HardhatUserConfig = {
  defaultNetwork: 'goerli',
  paths: {
    tests: TESTS_PATH
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      blockGasLimit: 100000000,
      gas: 100000000
    },
    goerli: {
      ...sharedNetworkConfig,
      url: `https://goerli.infura.io/v3/${INFURA_KEY}`
    }
  },
  //@ts-expect-error Type not found
  compilerOptions: {
    paths: { '^@safe-global/protocol-kit/(.*)$': ['../protocol-kit/src/*'] }
  }
}

export default config
