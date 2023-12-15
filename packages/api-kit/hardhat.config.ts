import '@nomicfoundation/hardhat-ethers'
import '@nomiclabs/hardhat-web3'
import { HardhatUserConfig } from 'hardhat/types'
import yargs from 'yargs'

import 'tsconfig-paths/register'

yargs
  .option('network', {
    type: 'string',
    default: 'hardhat'
  })
  .help(false)
  .version(false).argv

const { TESTS_PATH } = process.env

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  paths: {
    tests: TESTS_PATH
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      blockGasLimit: 100000000,
      gas: 100000000
    }
  },
  //@ts-expect-error Type not found
  compilerOptions: {
    paths: { '^@safe-global/protocol-kit/(.*)$': ['../protocol-kit/src/*'] }
  }
}

export default config
