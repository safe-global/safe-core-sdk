import { createPublicClient, http, toHex } from 'viem'
import { EstimateGasData } from '@safe-global/types-kit'
import {
  EstimateFeeFunctionProps,
  IFeeEstimator,
  UserOperationStringValues
} from '@safe-global/relay-kit/packs/safe-4337/types'
import {
  createBundlerClient,
  userOperationToHexValues
} from '@safe-global/relay-kit/packs/safe-4337/utils'
import { RPC_4337_CALLS } from '@safe-global/relay-kit/packs/safe-4337/constants'

export type GenericFeeEstimatorOverrides = {
  callGasLimit?: bigint
  verificationGasLimit?: bigint
  preVerificationGas?: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  maxFeePerGasMultiplier?: number
  maxPriorityFeePerGasMultiplier?: number
  defaultVerificationGasLimitOverhead?: bigint
}

/**
 * GenericFeeEstimator is a class that implements the IFeeEstimator interface. You can implement three optional methods that will be called during the estimation process:
 * - preEstimateUserOperationGas: Setup the userOperation before calling the eth_estimateUserOperation gas method.
 * - postEstimateUserOperationGas: Adjust the userOperation values returned after calling the eth_estimateUserOperation method.
 */
export class GenericFeeEstimator implements IFeeEstimator {
  defaultVerificationGasLimitOverhead: bigint
  overrides: GenericFeeEstimatorOverrides
  rpcUrl: string

  constructor(rpcUrl: string, overrides: GenericFeeEstimatorOverrides = {}) {
    this.defaultVerificationGasLimitOverhead =
      overrides.defaultVerificationGasLimitOverhead ?? 35_000n
    this.overrides = overrides
    this.rpcUrl = rpcUrl
  }

  async preEstimateUserOperationGas({
    userOperation,
    entryPoint,
    paymasterOptions,
    protocolKit
  }: EstimateFeeFunctionProps): Promise<EstimateGasData> {
    let feeDataRes: EstimateGasData = {}
    let paymasterStubDataRes = {}

    if (paymasterOptions) {
      const chainId = await protocolKit.getChainId()
      const paymasterClient = createBundlerClient(paymasterOptions.paymasterUrl)
      const context =
        'paymasterTokenAddress' in paymasterOptions
          ? {
              token: paymasterOptions.paymasterTokenAddress
            }
          : (paymasterOptions.paymasterContext ?? {})

      const [feeData, paymasterStubData] = await Promise.all([
        this.#getUserOperationGasPrices(this.rpcUrl),
        paymasterClient.request({
          method: RPC_4337_CALLS.GET_PAYMASTER_STUB_DATA,
          params: [
            userOperationToHexValues(userOperation, entryPoint),
            entryPoint,
            toHex(chainId),
            context
          ]
        })
      ])
      feeDataRes = feeData
      paymasterStubDataRes = paymasterStubData
    } else {
      const feeData = await this.#getUserOperationGasPrices(this.rpcUrl)
      feeDataRes = feeData
    }

    feeDataRes.callGasLimit = this.overrides.callGasLimit ?? feeDataRes.callGasLimit
    feeDataRes.verificationGasLimit =
      this.overrides.verificationGasLimit ?? feeDataRes.verificationGasLimit
    feeDataRes.preVerificationGas =
      this.overrides.preVerificationGas ?? feeDataRes.preVerificationGas
    feeDataRes.maxFeePerGas = this.overrides.maxFeePerGas ?? feeDataRes.maxFeePerGas
    feeDataRes.maxPriorityFeePerGas =
      this.overrides.maxPriorityFeePerGas ?? feeDataRes.maxPriorityFeePerGas

    const result = {
      ...feeDataRes,
      ...paymasterStubDataRes
    }
    if (result.verificationGasLimit != null) {
      const threshold = await protocolKit.getThreshold()
      result.verificationGasLimit = (
        BigInt(result.verificationGasLimit) +
        BigInt(threshold) * this.defaultVerificationGasLimitOverhead
      ).toString()
    }
    return result
  }

  async postEstimateUserOperationGas({
    userOperation,
    entryPoint,
    paymasterOptions,
    protocolKit
  }: EstimateFeeFunctionProps): Promise<EstimateGasData> {
    if (protocolKit == null) {
      throw new Error("Can't use GenericFeeEstimator if protocolKit is null.")
    }

    if (!paymasterOptions) return {}

    const paymasterClient = createBundlerClient(paymasterOptions.paymasterUrl)
    const chainId = await protocolKit.getChainId()
    if (paymasterOptions.isSponsored) {
      const params: [UserOperationStringValues, string, string, Record<string, unknown>?] = [
        userOperationToHexValues(userOperation, entryPoint),
        entryPoint,
        toHex(chainId)
      ]

      if (paymasterOptions.paymasterContext) {
        params.push(paymasterOptions.paymasterContext)
      }

      const sponsoredData = await paymasterClient.request({
        method: RPC_4337_CALLS.GET_PAYMASTER_DATA,
        params
      })

      return sponsoredData
    }

    const erc20PaymasterData = await paymasterClient.request({
      method: RPC_4337_CALLS.GET_PAYMASTER_DATA,
      params: [
        userOperationToHexValues(userOperation, entryPoint),
        entryPoint,
        toHex(chainId),
        { token: paymasterOptions.paymasterTokenAddress }
      ]
    })

    if (
      'verificationGasLimit' in erc20PaymasterData &&
      erc20PaymasterData.verificationGasLimit != null
    ) {
      const threshold = await protocolKit.getThreshold()
      erc20PaymasterData.verificationGasLimit = (
        BigInt(erc20PaymasterData.verificationGasLimit) +
        BigInt(threshold) * this.defaultVerificationGasLimitOverhead
      ).toString()
    }
    return erc20PaymasterData
  }

  async #getUserOperationGasPrices(
    rpcUrl: string
  ): Promise<Pick<EstimateGasData, 'maxFeePerGas' | 'maxPriorityFeePerGas'>> {
    const client = createPublicClient({
      transport: http(rpcUrl)
    })
    const [block, maxPriorityFeePerGas] = await Promise.all([
      client.getBlock({ blockTag: 'latest' }),
      client.estimateMaxPriorityFeePerGas()
    ])
    // Base fee from the block (can be undefined for non-EIP1559 blocks)
    const baseFeePerGas = block.baseFeePerGas

    if (!baseFeePerGas) {
      throw new Error('Base fee not available - probably not an EIP-1559 block.')
    }

    // Calculate maxFeePerGas
    const maxFeePerGas = baseFeePerGas + maxPriorityFeePerGas
    return {
      maxFeePerGas: BigInt(
        Math.ceil(Number(maxFeePerGas) * (this.overrides.maxFeePerGasMultiplier ?? 1.5))
      ),
      maxPriorityFeePerGas: BigInt(
        Math.ceil(
          Number(maxPriorityFeePerGas) * (this.overrides.maxPriorityFeePerGasMultiplier ?? 1.5)
        )
      )
    }
  }
}
