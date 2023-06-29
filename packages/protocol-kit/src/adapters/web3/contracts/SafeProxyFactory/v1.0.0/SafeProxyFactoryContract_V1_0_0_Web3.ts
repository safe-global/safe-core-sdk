import { Proxy_factory as ProxyFactory } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.0.0/Proxy_factory'
import SafeProxyFactoryWeb3Contract from '../SafeProxyFactoryWeb3Contract'

class SafeProxyFactoryContract_V1_0_0_Web3 extends SafeProxyFactoryWeb3Contract {
  constructor(public contract: ProxyFactory) {
    super(contract)
  }
}

export default SafeProxyFactoryContract_V1_0_0_Web3
