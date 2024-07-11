import { TextEncoder } from 'util'

// TextEncoder is used by viem but not bundled with it. Therefore we need to polyfill it for the tests.
Object.assign(global, { TextEncoder })
