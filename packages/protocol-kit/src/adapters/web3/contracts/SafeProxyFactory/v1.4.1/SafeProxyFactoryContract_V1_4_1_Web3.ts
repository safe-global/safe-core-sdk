import { Safe_proxy_factory as SafeProxyFactory } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.4.1/Safe_proxy_factory'
import SafeProxyFactoryWeb3Contract from '../SafeProxyFactoryWeb3Contract'

class SafeProxyFactoryContract_V1_4_1_Web3 extends SafeProxyFactoryWeb3Contract {
  constructor(public contract: SafeProxyFactory) {
    super(contract)
  }
}

export default SafeProxyFactoryContract_V1_4_1_Web3
