import { CreateCallContract_v1_3_0_Contract } from './v1.3.0/CreateCallContract_v1_3_0'
import { CreateCallContract_v1_4_1_Contract } from './v1.4.1/CreateCallContract_v1_4_1'

export * from './v1.3.0/CreateCallContract_v1_3_0'
export * from './v1.4.1/CreateCallContract_v1_4_1'

export type CreateCallContractType =
  | CreateCallContract_v1_3_0_Contract
  | CreateCallContract_v1_4_1_Contract
