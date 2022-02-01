import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-web3'
import { HardhatUserConfig } from 'hardhat/types'

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      { version: '0.5.17' },
      { version: '0.5.3' },
      { version: '0.8.0' },
    ]
  },
  paths: {
    artifacts: 'artifacts',
    sources: 'contracts',
    tests: 'tests'
  }
}

export default config
