import { MultiSendContract_v1_1_1_Contract } from './v1.1.1/MultiSendContract_v1_1_1'
import { MultiSendCallOnlyContract_v1_3_0_Contract } from './v1.3.0/MultiSendCallOnlyContract_v1_3_0'
import { MultiSendContract_v1_3_0_Contract } from './v1.3.0/MultiSendContract_v1_3_0'
import { MultiSendCallOnlyContract_v1_4_1_Contract } from './v1.4.1/MultiSendCallOnlyContract_v1_4_1'
import { MultiSendContract_v1_4_1_Contract } from './v1.4.1/MultiSendContract_v1_4_1'

export * from './v1.1.1/MultiSendContract_v1_1_1'
export * from './v1.3.0/MultiSendContract_v1_3_0'
export * from './v1.4.1/MultiSendContract_v1_4_1'

export * from './v1.3.0/MultiSendCallOnlyContract_v1_3_0'
export * from './v1.4.1/MultiSendCallOnlyContract_v1_4_1'

export type MultiSendContractType =
  | MultiSendContract_v1_1_1_Contract
  | MultiSendContract_v1_3_0_Contract
  | MultiSendContract_v1_4_1_Contract

export type MultiSendCallOnlyContractType =
  | MultiSendCallOnlyContract_v1_3_0_Contract
  | MultiSendCallOnlyContract_v1_4_1_Contract
