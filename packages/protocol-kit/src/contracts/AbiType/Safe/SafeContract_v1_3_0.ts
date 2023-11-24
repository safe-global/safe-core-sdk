import {
  narrow,
  ExtractAbiFunctionNames,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction
} from 'abitype'
import safe_1_3_0_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/Safe/v1.3.0/gnosis_safe_l2'
import { EthersTransactionOptions } from '@safe-global/protocol-kit/adapters/ethers'

// see docs: https://abitype.dev/config
declare module 'abitype' {
  export interface Register {
    // AddressType: `0x${string}`
    // BytesType: {
    //   inputs: `0x${string}` | Uint8Array
    //   outputs: `0x${string}`
    // }
    AddressType: string
    BytesType: {
      inputs: string
      outputs: string
    }
  }
}

const safeContract_v1_3_0_AbiTypes = narrow(safe_1_3_0_ContractArtifacts.abi)

export type SafeContract_v1_3_0_Abi = typeof safeContract_v1_3_0_AbiTypes

export type Safe_v1_3_0_Read_Functions = ExtractAbiFunctionNames<
  SafeContract_v1_3_0_Abi,
  'view' | 'pure'
>

export type Safe_v1_3_0_Write_Functions = ExtractAbiFunctionNames<
  SafeContract_v1_3_0_Abi,
  'nonpayable' | 'payable'
>

// TODO: create a SafeContract generic interface

// TODO: all methods can be estimated
// TODO: all methods can be encoded

export type EncodeSafeFunction<SafeFunction extends Safe_v1_3_0_Write_Functions> = (
  functionToEncode: SafeFunction,
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<SafeContract_v1_3_0_Abi, SafeFunction>['inputs'],
    'inputs'
  >
) => string

export type EstimateSafeFunction<SafeFunction extends Safe_v1_3_0_Write_Functions> = (
  functionToEncode: SafeFunction,
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<SafeContract_v1_3_0_Abi, SafeFunction>['inputs'],
    'inputs'
  >,
  options?: EthersTransactionOptions
) => Promise<bigint>

type SafeContract_v1_3_0_Contract = {
  // Read methods
  [SafeFunction in Safe_v1_3_0_Read_Functions]: (
    // parameters
    args: AbiParametersToPrimitiveTypes<
      ExtractAbiFunction<SafeContract_v1_3_0_Abi, SafeFunction>['inputs'],
      'inputs'
    >
    // returned values as a Promise
  ) => Promise<
    AbiParametersToPrimitiveTypes<
      ExtractAbiFunction<SafeContract_v1_3_0_Abi, SafeFunction>['outputs'],
      'outputs'
    >
  >
} & {
  // Write methods always via encode
  encode: EncodeSafeFunction<Safe_v1_3_0_Write_Functions>
  estimateGas: EstimateSafeFunction<Safe_v1_3_0_Write_Functions>
}

export default SafeContract_v1_3_0_Contract
