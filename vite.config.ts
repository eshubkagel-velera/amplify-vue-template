import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    process: { env: {} }
  },
  resolve: {
    alias: {
      path: 'path-browserify',
      util: 'util',
      buffer: 'buffer'
    }
  },
  optimizeDeps: {
    include: ['buffer', 'path-browserify', 'util', 'process']
  }
});