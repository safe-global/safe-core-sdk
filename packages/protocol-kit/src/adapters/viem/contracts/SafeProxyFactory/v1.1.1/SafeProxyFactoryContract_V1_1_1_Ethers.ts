import { Proxy_factory__factory as SafeProxyFactory__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.1.1'
import SafeProxyFactoryContractViem from '../SafeProxyFactoryContractViem'
import { ViemContractBaseArgs } from '../../../ViemContract'

class SafeProxyFactoryContract_V1_1_1_Viem extends SafeProxyFactoryContractViem {
  constructor(args: ViemContractBaseArgs) {
    super({ ...args, abi: SafeProxyFactory__factory.abi })
  }
}

export default SafeProxyFactoryContract_V1_1_1_Viem
