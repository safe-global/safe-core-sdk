import { TextEncoder } from 'util'

// TextEncoder is used by viem, supported by Browsers natively for over five years and node since 11. All as a global export: https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder
// Since both on-ramp and auth-kit rely on being on a browser (i.e.: we access things directly from `window`) the tests are set with the configuration of `testEnvironment: 'jsdom'`
// js-dom doesnt set some of the globals: https://github.com/jestjs/jest/blob/v29.7.0/packages/jest-environment-jsdom/src/index.ts
// for reference, node does: https://github.com/jestjs/jest/blob/4e56991693da7cd4c3730dc3579a1dd1403ee630/packages/jest-environment-node/src/index.ts#L40

Object.assign(global, { TextEncoder })
