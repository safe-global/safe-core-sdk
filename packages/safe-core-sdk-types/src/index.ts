export * from './contracts/CompatibilityFallbackHandler'
export * from './contracts/MultiSend'
export * from './contracts/CreateCall'
export * from './contracts/Safe'
export * from './contracts/SafeProxyFactory'
export * from './contracts/SignMessageLib'
export * from './contracts/SimulateTxAccessor'
export * from './contracts/common/BaseContract'
export * from './contracts/assets'
export * from './types'

// see docs: https://abitype.dev/config
declare module 'abitype' {
  export interface Register {
    BytesType: {
      inputs: string
      outputs: string
    }
  }
}
