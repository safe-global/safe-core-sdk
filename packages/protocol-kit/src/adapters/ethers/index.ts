import { CreateProxyProps } from './contracts/GnosisSafeProxyFactory/GnosisSafeProxyFactoryEthersContract'
import EthersAdapter, { EthersAdapterConfig } from './EthersAdapter'
import { EthersTransactionOptions, EthersTransactionResult } from './types'

export default EthersAdapter
export { EthersAdapterConfig, EthersTransactionOptions, EthersTransactionResult, CreateProxyProps }
