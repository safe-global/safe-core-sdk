import '@nomicfoundation/hardhat-viem'
import 'hardhat-deploy'
import 'tsconfig-paths/register'
import { HardhatUserConfig } from 'hardhat/types'

import { getHardHatConfig } from './src/config'

const config: HardhatUserConfig = {
  ...getHardHatConfig()
}

export default config
