import { Safe_proxy_factory__factory as SafeProxyFactory__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.4.1'
import SafeProxyFactoryContractViem, {
  SafeProxyFactoryContractViemBaseArgs
} from '../SafeProxyFactoryContractViem'

class SafeProxyFactoryContract_V1_4_1_Viem extends SafeProxyFactoryContractViem {
  constructor(args: SafeProxyFactoryContractViemBaseArgs) {
    super({ ...args, abi: SafeProxyFactory__factory.abi })
  }
}

export default SafeProxyFactoryContract_V1_4_1_Viem
