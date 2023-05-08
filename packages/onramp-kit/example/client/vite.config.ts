import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  optimizeDeps: {
    disabled: false,
    include: [
      '@safe-global/protocol-kit',
      '@safe-global/api-kit',
      '@safe-global/safe-core-sdk-types'
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true
        }),
        NodeModulesPolyfillPlugin()
      ]
    }
  },
  define: {
    'process.env': {},
    global: {}
  },
  resolve: {
    alias: {
      '@safe-global/onramp-kit': path.resolve(__dirname, '../../src')
    }
  }
})
