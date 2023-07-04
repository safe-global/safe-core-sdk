import { Safe_proxy_factory as SafeProxyFactory } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.4.1/Safe_proxy_factory'
import SafeProxyFactoryEthersContract from '../SafeProxyFactoryEthersContract'

class SafeProxyFactoryContract_V1_4_1_Ethers extends SafeProxyFactoryEthersContract {
  constructor(public contract: SafeProxyFactory) {
    super(contract)
  }
}

export default SafeProxyFactoryContract_V1_4_1_Ethers
