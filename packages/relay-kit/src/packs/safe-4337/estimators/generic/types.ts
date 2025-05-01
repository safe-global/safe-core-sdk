import { UserOperationStringValues } from '@safe-global/relay-kit/packs/safe-4337/types'
import { RPC_4337_CALLS } from '@safe-global/relay-kit/packs/safe-4337/constants'

export type GetPaymasterStubDataRpcSchema = [
  {
    Method: RPC_4337_CALLS.GET_PAYMASTER_STUB_DATA
    Parameters: [UserOperationStringValues, string, string, Record<string, any>?]
    ReturnType:
      | {
          paymasterAndData: string
        }
      | {
          sponsor?: { name: string; icon?: string }
          paymaster?: string
          paymasterData?: string
          paymasterVerificationGasLimit?: string
          paymasterPostOpGasLimit?: string
          isFinal?: boolean
        }
  }
]

export type PaymasterRpcSchema = [
  {
    Method: RPC_4337_CALLS.GET_PAYMASTER_DATA
    Parameters: [UserOperationStringValues, string, string, Record<string, any>?]
    ReturnType:
      | {
          paymasterAndData: string
        }
      | {
          paymaster?: string
          paymasterData?: string
        }
  }
]
