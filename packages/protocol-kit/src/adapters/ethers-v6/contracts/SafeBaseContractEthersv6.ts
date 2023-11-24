import { Contract } from 'ethers'

import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import SafeBaseContract from '@safe-global/protocol-kit/contracts/AbiType/Safe/SafeBaseContract'
import EthersAdapter from '../../ethers/EthersAdapter'
import { contractName, safeDeploymentsL1ChainIds } from '@safe-global/protocol-kit/contracts/config'

// TODO: add docs
abstract class SafeBaseContractEthersv6<AbiType> extends SafeBaseContract<AbiType> {
  abstract contract: Contract
  abstract adapter: EthersAdapter

  constructor(
    chainId: bigint,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: AbiType,
    isL1SafeSingleton = false
  ) {
    const isL1Contract = safeDeploymentsL1ChainIds.includes(chainId) || isL1SafeSingleton

    const contractName: contractName = isL1Contract
      ? 'safeSingletonVersion'
      : 'safeSingletonL2Version'

    super(chainId, safeVersion, contractName, customContractAddress, customContractAbi)
  }
}

export default SafeBaseContractEthersv6
