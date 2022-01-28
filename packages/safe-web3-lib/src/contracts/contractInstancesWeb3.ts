import { SafeVersion } from '@gnosis.pm/safe-core-sdk-types'
import { GnosisSafe as SafeMasterCopy_V1_1_1 } from '../../typechain/src/web3-v1/v1.1.1/gnosis_safe'
import { MultiSend as MultiSend_V1_1_1 } from '../../typechain/src/web3-v1/v1.1.1/multi_send'
import { ProxyFactory as GnosisSafeProxyFactory_V1_1_1 } from '../../typechain/src/web3-v1/v1.1.1/proxy_factory'
import { GnosisSafe as SafeMasterCopy_V1_2_0 } from '../../typechain/src/web3-v1/v1.2.0/gnosis_safe'
import { GnosisSafe as SafeMasterCopy_V1_3_0 } from '../../typechain/src/web3-v1/v1.3.0/gnosis_safe'
import { MultiSend as MultiSend_V1_3_0 } from '../../typechain/src/web3-v1/v1.3.0/multi_send'
import { ProxyFactory as GnosisSafeProxyFactory_V1_3_0 } from '../../typechain/src/web3-v1/v1.3.0/proxy_factory'
import GnosisSafeContract_V1_1_1_Web3 from './GnosisSafe/v1.1.1/GnosisSafeContract_V1_1_1_Web3'
import GnosisSafeContract_V1_2_0_Web3 from './GnosisSafe/v1.2.0/GnosisSafeContract_V1_2_0_Web3'
import GnosisSafeContract_V1_3_0_Web3 from './GnosisSafe/v1.3.0/GnosisSafeContract_V1_3_0_Web3'
import GnosisSafeProxyFactoryContract_V1_1_1_Web3 from './GnosisSafeProxyFactory/v1.1.1/GnosisSafeProxyFactoryContract_V1_1_1_Web3'
import GnosisSafeProxyFactoryContract_V1_3_0_Web3 from './GnosisSafeProxyFactory/v1.3.0/GnosisSafeProxyFactoryContract_V1_3_0_Web3'
import MultiSendContract_V1_1_1_Web3 from './MultiSend/v1.1.1/MultiSendContract_V1_1_1_Web3'
import MultiSendContract_V1_3_0_Web3 from './MultiSend/v1.3.0/MultiSendContract_V1_3_0_Web3'

export function getSafeContractInstance(
  safeVersion: SafeVersion,
  safeContract: SafeMasterCopy_V1_3_0 | SafeMasterCopy_V1_2_0 | SafeMasterCopy_V1_1_1
):
  | GnosisSafeContract_V1_3_0_Web3
  | GnosisSafeContract_V1_2_0_Web3
  | GnosisSafeContract_V1_1_1_Web3 {
  switch (safeVersion) {
    case '1.3.0':
      return new GnosisSafeContract_V1_3_0_Web3(safeContract as SafeMasterCopy_V1_3_0)
    case '1.2.0':
      return new GnosisSafeContract_V1_2_0_Web3(safeContract as SafeMasterCopy_V1_2_0)
    case '1.1.1':
      return new GnosisSafeContract_V1_1_1_Web3(safeContract as SafeMasterCopy_V1_1_1)
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getMultiSendContractInstance(
  safeVersion: SafeVersion,
  multiSendContract: MultiSend_V1_3_0 | MultiSend_V1_1_1
): MultiSendContract_V1_3_0_Web3 | MultiSendContract_V1_1_1_Web3 {
  switch (safeVersion) {
    case '1.3.0':
      return new MultiSendContract_V1_3_0_Web3(multiSendContract as MultiSend_V1_3_0)
    case '1.2.0':
    case '1.1.1':
      return new MultiSendContract_V1_1_1_Web3(multiSendContract as MultiSend_V1_1_1)
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getGnosisSafeProxyFactoryContractInstance(
  safeVersion: SafeVersion,
  gnosisSafeProxyFactoryContract: GnosisSafeProxyFactory_V1_3_0 | GnosisSafeProxyFactory_V1_1_1
): GnosisSafeProxyFactoryContract_V1_3_0_Web3 | GnosisSafeProxyFactoryContract_V1_1_1_Web3 {
  switch (safeVersion) {
    case '1.3.0':
      return new GnosisSafeProxyFactoryContract_V1_3_0_Web3(
        gnosisSafeProxyFactoryContract as GnosisSafeProxyFactory_V1_3_0
      )
    case '1.2.0':
    case '1.1.1':
      return new GnosisSafeProxyFactoryContract_V1_1_1_Web3(
        gnosisSafeProxyFactoryContract as GnosisSafeProxyFactory_V1_1_1
      )
    default:
      throw new Error('Invalid Safe version')
  }
}
