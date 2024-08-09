import SafeApiKit, { SafeApiKitConfig } from './SafeApiKit'

export * from './types/safeTransactionServiceTypes'
export { SafeApiKitConfig }
export default SafeApiKit

declare module 'viem/node_modules/abitype' {
  export interface Register {
    AddressType: string
  }
}
