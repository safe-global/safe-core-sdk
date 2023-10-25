export interface SimulateTxAccessorContract {
  getAddress(): Promise<string>
  encode(methodName: any, params: any): string
}
