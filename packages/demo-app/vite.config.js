import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'h5-video-embed': resolve(__dirname, '../h5-video-embed/src')
    }
  },
  optimizeDeps: {
    include: ['h5-video-embed']
  }
})
