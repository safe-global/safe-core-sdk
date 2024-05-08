export type PasskeyCoordinates = {
  x: string
  y: string
}

export type passkeyArgType = {
  rawId: ArrayBuffer // required to sign data
  publicKey: ArrayBuffer // required to generate X & Y Coordinates
}
