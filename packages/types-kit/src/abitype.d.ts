import 'abitype'

// See docs: https://abitype.dev/config
declare module 'abitype' {
  export interface Register {
    // AddressType: `0x${string}`
    // BytesType: {
    //   inputs: `0x${string}` | Uint8Array
    //   outputs: `0x${string}`
    // }
    AddressType: string
  }
}
