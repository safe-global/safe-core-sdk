import { Proxy_factory__factory as SafeProxyFactory__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.0.0'
import SafeProxyFactoryContractViem, {
  SafeProxyFactoryContractViemBaseArgs
} from '../SafeProxyFactoryContractViem'

class SafeProxyFactoryContract_V1_0_0_Viem extends SafeProxyFactoryContractViem {
  constructor(args: SafeProxyFactoryContractViemBaseArgs) {
    super({ ...args, abi: SafeProxyFactory__factory.abi })
  }
}

export default SafeProxyFactoryContract_V1_0_0_Viem
