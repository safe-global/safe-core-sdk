import { Proxy_factory as ProxyFactory } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.1.1/Proxy_factory'
import GnosisSafeProxyFactoryWeb3Contract from '../GnosisSafeProxyFactoryWeb3Contract'

class GnosisSafeProxyFactoryContract_V1_1_1_Web3 extends GnosisSafeProxyFactoryWeb3Contract {
  constructor(public contract: ProxyFactory) {
    super(contract)
  }
}

export default GnosisSafeProxyFactoryContract_V1_1_1_Web3
