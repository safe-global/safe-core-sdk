export enum SigningMethod {
  ETH_SIGN = 'eth_sign',
  ETH_SIGN_TYPED_DATA = 'eth_signTypedData',
  ETH_SIGN_TYPED_DATA_V3 = 'eth_signTypedData_v3',
  ETH_SIGN_TYPED_DATA_V4 = 'eth_signTypedData_v4',
  SAFE_SIGNATURE = 'safe_sign'
}

export type SigningMethodType = SigningMethod | string
