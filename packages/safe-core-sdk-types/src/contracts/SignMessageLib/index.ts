import { SignMessageLibContract_v1_3_0_Contract } from './v1.3.0/SignMessageLibContract_v1_3_0'
import { SignMessageLibContract_v1_4_1_Contract } from './v1.4.1/SignMessageLibContract_v1_4_1'

export * from './v1.3.0/SignMessageLibContract_v1_3_0'
export * from './v1.4.1/SignMessageLibContract_v1_4_1'

export type SignMessageLibContractType =
  | SignMessageLibContract_v1_3_0_Contract
  | SignMessageLibContract_v1_4_1_Contract
