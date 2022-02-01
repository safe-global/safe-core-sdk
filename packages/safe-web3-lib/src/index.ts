import { Web3TransactionResult } from './contracts/GnosisSafe/GnosisSafeContractWeb3'
import { CreateProxyProps } from './contracts/GnosisSafeProxyFactory/GnosisSafeProxyFactoryWeb3Contract'
import { Web3TransactionOptions } from './types'
import Web3Adapter, { Web3AdapterConfig } from './Web3Adapter'

export default Web3Adapter
export { Web3AdapterConfig, Web3TransactionOptions, CreateProxyProps, Web3TransactionResult }
