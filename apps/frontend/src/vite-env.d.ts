import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // permite usar "@/components" etc.
    },
  },
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'), // Certifique-se de usar require para v4.1.5
        require('autoprefixer'),
      ],
    },
    preprocessorOptions: {
      css: {
        charset: false, // evita warning do @charset no build
      },
    },
  },
  server: {
    port: 5173,       // porta padrão, edite se necessário
    open: true,       // abre no navegador ao iniciar
  },
})