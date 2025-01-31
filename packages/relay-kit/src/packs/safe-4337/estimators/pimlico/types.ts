import { UserOperationStringValues } from '@safe-global/relay-kit/packs/safe-4337/types'

export enum PIMLICO_CUSTOM_RPC_4337_CALLS {
  GET_USER_OPERATION_GAS_PRICE = 'pimlico_getUserOperationGasPrice',
  SPONSOR_USER_OPERATION = 'pm_sponsorUserOperation'
}

export type PimlicoCustomRpcSchema = [
  {
    Method: PIMLICO_CUSTOM_RPC_4337_CALLS.GET_USER_OPERATION_GAS_PRICE
    Parameters: never
    ReturnType: {
      slow: { maxFeePerGas: string; maxPriorityFeePerGas: string }
      standard: { maxFeePerGas: string; maxPriorityFeePerGas: string }
      fast: { maxFeePerGas: string; maxPriorityFeePerGas: string }
    }
  },
  {
    Method: PIMLICO_CUSTOM_RPC_4337_CALLS.SPONSOR_USER_OPERATION
    Parameters: [UserOperationStringValues, string, { sponsorshipPolicyId: string }?]
    ReturnType:
      | {
          paymasterAndData: string
          callGasLimit: string
          verificationGasLimit: string
          verificationGas: string
          preVerificationGas: string
        }
      | {
          paymaster: string
          paymasterData: string
          callGasLimit: string
          verificationGasLimit: string
          verificationGas: string
          preVerificationGas: string
          paymasterVerificationGasLimit: string
          paymasterPostOpGasLimit: string
        }
  }
]
