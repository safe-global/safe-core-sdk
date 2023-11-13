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
      '@safe-global/api-kit',
      '@safe-global/auth-kit',
      '@safe-global/protocol-kit',
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
      // Map the packages to the local build directories. Rebuild the project and restart the server if any package change locally
      '@safe-global/api-kit': path.resolve(__dirname, '../../../api-kit/dist/src'),
      '@safe-global/auth-kit': path.resolve(__dirname, '../../../auth-kit/dist/src'),
      '@safe-global/protocol-kit': path.resolve(__dirname, '../../../protocol-kit/dist/src'),
      '@safe-global/safe-core-sdk-types': path.resolve(
        __dirname,
        '../../../safe-core-sdk-types/dist/src'
      ),
      // Map this kit to the local source directory. Any changes to the source files are reflected on the fly
      '@safe-global/onramp-kit': path.resolve(__dirname, '../../src')
    }
  }
})
