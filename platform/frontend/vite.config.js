import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        silenceDeprecations: ['import', 'color-functions', 'global-builtin'],
      },
    },
  },
  server: {
    // Allow the development server to be reached at this host (used in dev compose).
    allowedHosts: ['meshlogiq.local'],
    host: true,
    port: 3000,
    strictPort: true,
    hmr: {
      host: process.env.VITE_HMR_HOST || 'dev.meshlogiq.local',
      clientPort: 443,
      protocol: 'wss',
    },
  },
})
