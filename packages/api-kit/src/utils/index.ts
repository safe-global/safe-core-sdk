import { EMPTY_DATA } from './constants'

export const isEmptyHexData = (input: string) => !input || input === EMPTY_DATA
