import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    // setupFiles: ['./src/tests/setup.js']
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    process: { env: {} }
  },
  resolve: {
    alias: {
      '@': './src',
      path: 'path-browserify',
      util: 'util', 
      buffer: 'buffer',
      stream: 'stream-browserify',
      os: 'os-browserify/browser'
    }
  }
})