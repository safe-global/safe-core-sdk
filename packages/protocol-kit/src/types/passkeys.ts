export type PasskeyCoordinates = {
  x: string
  y: string
}

export type PasskeyArgType = {
  rawId: string // required to sign data
  coordinates: PasskeyCoordinates // required to sign data
  customVerifierAddress?: string // optional
}
