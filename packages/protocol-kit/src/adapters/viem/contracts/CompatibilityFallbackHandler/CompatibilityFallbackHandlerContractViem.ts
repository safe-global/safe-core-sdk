import { Compatibility_fallback_handler__factory as CompatibilityFallbackHandler_V1_3_0__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.3.0'
import { Compatibility_fallback_handler__factory as CompatibilityFallbackHandler_V1_4_1__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.4.1'
import { CompatibilityFallbackHandlerContract } from '@safe-global/safe-core-sdk-types'
import { Address, GetContractReturnType, encodeFunctionData, getContract } from 'viem'
import { ClientPair } from '../../types'

type CompatibilityFallbackHandlerAbi =
  | typeof CompatibilityFallbackHandler_V1_3_0__factory.abi
  | typeof CompatibilityFallbackHandler_V1_4_1__factory.abi

export type CompatibilityFallbackHandlerContractViemBaseArgs = {
  address: Address
  client: ClientPair
}

abstract class CompatibilityFallbackHandlerContractViem
  implements CompatibilityFallbackHandlerContract
{
  public readonly contract: GetContractReturnType<
    CompatibilityFallbackHandlerAbi,
    ClientPair,
    Address
  >
  public readonly client: ClientPair

  constructor(
    args: CompatibilityFallbackHandlerContractViemBaseArgs & {
      abi: CompatibilityFallbackHandlerAbi
    }
  ) {
    this.client = args.client
    this.contract = getContract({
      abi: args.abi,
      address: args.address,
      client: args.client
    })
  }

  async getAddress() {
    return this.contract.address
  }

  encode(methodName: any, params: any) {
    return encodeFunctionData({
      abi: this.contract.abi,
      functionName: methodName as any,
      args: params as any
    })
  }
}

export default CompatibilityFallbackHandlerContractViem
