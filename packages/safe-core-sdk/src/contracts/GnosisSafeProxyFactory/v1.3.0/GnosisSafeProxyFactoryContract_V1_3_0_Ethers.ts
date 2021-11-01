import { ProxyFactory } from '../../../../typechain/src/ethers-v5/v1.3.0/ProxyFactory'
import GnosisSafeProxyFactoryEthersContract from '../GnosisSafeProxyFactoryEthersContract'

class GnosisSafeProxyFactoryContract_V1_3_0_Ethers extends GnosisSafeProxyFactoryEthersContract {
  constructor(public contract: ProxyFactory) {
    super(contract)
  }
}

export default GnosisSafeProxyFactoryContract_V1_3_0_Ethers
