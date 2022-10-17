export interface CreateCallContract {
  getAddress(): string
  encode(methodName: any, params: any): string
}
