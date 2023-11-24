import { contractName, getContractDeployment } from '@safe-global/protocol-kit/contracts/config'
import { SafeVersion } from 'packages/safe-core-sdk-types/dist/src'

// TODO: move this to /adapters

abstract class SafeBaseContract<AbiType> {
  contractAbi?: AbiType
  contractAddress: string
  safeVersion: SafeVersion

  abstract contract: unknown // this is implemented for each Adapter
  abstract adapter: unknown // this is implemented for each Adapter

  constructor(
    chainId: bigint,
    safeVersion: SafeVersion,
    contractName: contractName,
    customContractAddress?: string,
    customContractAbi?: AbiType
  ) {
    const contractDeployment = getContractDeployment(safeVersion, chainId, contractName)

    const contractAddress = customContractAddress || contractDeployment?.defaultAddress

    if (!contractAddress) {
      throw new Error(`Invalid ${contractName.replace('Version', '')} contract address`)
    }

    this.contractAddress = contractAddress
    this.contractAbi = customContractAbi || (contractDeployment?.abi as AbiType) // this cast is required because abi is set as any[] in safe-deployments
    this.safeVersion = safeVersion
  }
}

export default SafeBaseContract
