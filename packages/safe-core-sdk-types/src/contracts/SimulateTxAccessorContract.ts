export interface SimulateTxAccessorContract {
  getAddress(): string
  encode(methodName: any, params: any): string
}
