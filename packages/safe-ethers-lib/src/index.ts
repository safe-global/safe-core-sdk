import { EthersTransactionResult } from './contracts/GnosisSafe/GnosisSafeContractEthers'
import { CreateProxyProps } from './contracts/GnosisSafeProxyFactory/GnosisSafeProxyFactoryEthersContract'
import EthersAdapter, { EthersAdapterConfig } from './EthersAdapter'
import { EthersTransactionOptions } from './types'

export default EthersAdapter
export { EthersAdapterConfig, EthersTransactionOptions, EthersTransactionResult, CreateProxyProps }
