import { Signer } from '@ethersproject/abstract-signer'
import { SafeVersion } from '@gnosis.pm/safe-core-sdk-types'
import { GnosisSafe__factory as SafeMasterCopy_V1_1_1 } from '../../typechain/src/ethers-v5/v1.1.1/factories/GnosisSafe__factory'
import { MultiSend__factory as MultiSend_V1_1_1 } from '../../typechain/src/ethers-v5/v1.1.1/factories/MultiSend__factory'
import { ProxyFactory__factory as SafeProxyFactory_V1_1_1 } from '../../typechain/src/ethers-v5/v1.1.1/factories/ProxyFactory__factory'
import { GnosisSafe__factory as SafeMasterCopy_V1_2_0 } from '../../typechain/src/ethers-v5/v1.2.0/factories/GnosisSafe__factory'
import { GnosisSafe__factory as SafeMasterCopy_V1_3_0 } from '../../typechain/src/ethers-v5/v1.3.0/factories/GnosisSafe__factory'
import { MultiSendCallOnly__factory as MultiSendCallOnly_V1_3_0 } from '../../typechain/src/ethers-v5/v1.3.0/factories/MultiSendCallOnly__factory'
import { MultiSend__factory as MultiSend_V1_3_0 } from '../../typechain/src/ethers-v5/v1.3.0/factories/MultiSend__factory'
import { ProxyFactory__factory as SafeProxyFactory_V1_3_0 } from '../../typechain/src/ethers-v5/v1.3.0/factories/ProxyFactory__factory'
import GnosisSafeContract_V1_1_1_Ethers from './GnosisSafe/v1.1.1/GnosisSafeContract_V1_1_1_Ethers'
import GnosisSafeContract_V1_2_0_Ethers from './GnosisSafe/v1.2.0/GnosisSafeContract_V1_2_0_Ethers'
import GnosisSafeContract_V1_3_0_Ethers from './GnosisSafe/v1.3.0/GnosisSafeContract_V1_3_0_Ethers'
import GnosisSafeProxyFactoryContract_V1_1_1_Ethers from './GnosisSafeProxyFactory/v1.1.1/GnosisSafeProxyFactoryContract_V1_1_1_Ethers'
import GnosisSafeProxyFactoryContract_V1_3_0_Ethers from './GnosisSafeProxyFactory/v1.3.0/GnosisSafeProxyFactoryContract_V1_3_0_Ethers'
import MultiSendContract_V1_1_1_Ethers from './MultiSend/v1.1.1/MultiSendContract_V1_1_1_Ethers'
import MultiSendContract_V1_3_0_Ethers from './MultiSend/v1.3.0/MultiSendContract_V1_3_0_Ethers'
import MultiSendCallOnlyContract_V1_3_0_Ethers from './MultiSendCallOnly/v1.3.0/MultiSendCallOnlyContract_V1_3_0_Ethers'

export function getSafeContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  signer: Signer
):
  | GnosisSafeContract_V1_3_0_Ethers
  | GnosisSafeContract_V1_2_0_Ethers
  | GnosisSafeContract_V1_1_1_Ethers {
  let safeContract
  switch (safeVersion) {
    case '1.3.0':
      safeContract = SafeMasterCopy_V1_3_0.connect(contractAddress, signer)
      return new GnosisSafeContract_V1_3_0_Ethers(safeContract)
    case '1.2.0':
      safeContract = SafeMasterCopy_V1_2_0.connect(contractAddress, signer)
      return new GnosisSafeContract_V1_2_0_Ethers(safeContract)
    case '1.1.1':
      safeContract = SafeMasterCopy_V1_1_1.connect(contractAddress, signer)
      return new GnosisSafeContract_V1_1_1_Ethers(safeContract)
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getMultiSendContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  signer: Signer
): MultiSendContract_V1_3_0_Ethers | MultiSendContract_V1_1_1_Ethers {
  let multiSendContract
  switch (safeVersion) {
    case '1.3.0':
      multiSendContract = MultiSend_V1_3_0.connect(contractAddress, signer)
      return new MultiSendContract_V1_3_0_Ethers(multiSendContract)
    case '1.2.0':
    case '1.1.1':
      multiSendContract = MultiSend_V1_1_1.connect(contractAddress, signer)
      return new MultiSendContract_V1_1_1_Ethers(multiSendContract)
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getMultiSendCallOnlyContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  signer: Signer
): MultiSendCallOnlyContract_V1_3_0_Ethers {
  let multiSendCallOnlyContract
  switch (safeVersion) {
    case '1.3.0':
      multiSendCallOnlyContract = MultiSendCallOnly_V1_3_0.connect(contractAddress, signer)
      return new MultiSendCallOnlyContract_V1_3_0_Ethers(multiSendCallOnlyContract)
    case '1.2.0':
    case '1.1.1':
    default:
      throw new Error('Invalid Safe version')
  }
}

export function getSafeProxyFactoryContractInstance(
  safeVersion: SafeVersion,
  contractAddress: string,
  signer: Signer
): GnosisSafeProxyFactoryContract_V1_3_0_Ethers | GnosisSafeProxyFactoryContract_V1_1_1_Ethers {
  let gnosisSafeProxyFactoryContract
  switch (safeVersion) {
    case '1.3.0':
      gnosisSafeProxyFactoryContract = SafeProxyFactory_V1_3_0.connect(contractAddress, signer)
      return new GnosisSafeProxyFactoryContract_V1_3_0_Ethers(gnosisSafeProxyFactoryContract)
    case '1.2.0':
    case '1.1.1':
      gnosisSafeProxyFactoryContract = SafeProxyFactory_V1_1_1.connect(contractAddress, signer)
      return new GnosisSafeProxyFactoryContract_V1_1_1_Ethers(gnosisSafeProxyFactoryContract)
    default:
      throw new Error('Invalid Safe version')
  }
}
