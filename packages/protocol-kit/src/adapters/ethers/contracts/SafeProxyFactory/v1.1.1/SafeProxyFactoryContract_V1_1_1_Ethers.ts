import { Proxy_factory as ProxyFactory } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.1.1/Proxy_factory'
import SafeProxyFactoryEthersContract from '../SafeProxyFactoryEthersContract'

class SafeProxyFactoryContract_V1_1_1_Ethers extends SafeProxyFactoryEthersContract {
  constructor(public contract: ProxyFactory) {
    super(contract)
  }
}

export default SafeProxyFactoryContract_V1_1_1_Ethers
