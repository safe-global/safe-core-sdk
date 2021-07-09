import { SafeAccountConfig } from './'

export const validateSafeAccountConfig = ({ owners, threshold }: SafeAccountConfig): void => {
  if (owners.length <= 0) throw new Error('Owner list must have at least one owner')
  if (threshold <= 0) throw new Error('Threshold must be greater than or equal to 0')
  if (threshold > owners.length)
    throw new Error('Threshold must be lower than or equal to owners length')
}
