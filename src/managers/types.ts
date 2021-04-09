export enum SafeSettings {
  ADD_OWNER_WITH_THRESHOLD = 'addOwnerWithThreshold',
  REMOVE_OWNER = 'removeOwner',
  SWAP_OWNER = 'swapOwner',
  CHANGE_THRESHOLD = 'changeThreshold',
  ENABLE_MODULE = 'enableModule',
  DISABLE_MODULE = 'disableModule'
}

export type AddOwnerWithThreshold = {
  method: SafeSettings.ADD_OWNER_WITH_THRESHOLD
  ownerAddress: string
  threshold?: number
}

export type RemoveOwner = {
  method: SafeSettings.REMOVE_OWNER
  ownerAddress: string
  threshold?: number
}

export type SwapOwner = {
  method: SafeSettings.SWAP_OWNER
  oldOwnerAddress: string
  newOwnerAddress: string
}

export type ChangeThreshold = {
  method: SafeSettings.CHANGE_THRESHOLD
  threshold: number
}

export type EnableModule = {
  method: SafeSettings.ENABLE_MODULE
  moduleAddress: string
}

export type DisableModule = {
  method: SafeSettings.DISABLE_MODULE
  moduleAddress: string
}

export type ContractCallParams =
  | AddOwnerWithThreshold
  | RemoveOwner
  | SwapOwner
  | ChangeThreshold
  | EnableModule
  | DisableModule
