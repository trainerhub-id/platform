import svgr from '@svgr/rollup'
import react from '@vitejs/plugin-react'
import fs from 'fs/promises'
import { resolve } from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      src: resolve(__dirname, 'src'),
    },
  },
  esbuild: {
    loader: 'tsx',
    include: /src\/.*\.tsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    include: ['void-elements', '@assistant-ui/react'],
    esbuildOptions: {
      plugins: [
        {
          name: 'load-js-files-as-tsx',
          setup(build) {
            build.onLoad({ filter: /src\\.*\.js$/ }, async (args) => ({
              loader: 'tsx',
              contents: await fs.readFile(args.path, 'utf8'),
            }))
          },
        },
      ],
    },
  },
  build: {
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('@assistant-ui/react')) {
            return 'assistant-ui'
          }

          if (id.includes('/apexcharts/')) {
            return 'chart-apex-core'
          }

          if (id.includes('/react-apexcharts/')) {
            return 'chart-react-apex'
          }

          if (id.includes('@tiptap/')) {
            return 'editor-tiptap'
          }

          if (id.includes('leaflet') || id.includes('react-leaflet')) {
            return 'maps-leaflet'
          }

          if (
            id.includes('framer-motion') ||
            id.includes('lottie-react') ||
            id.includes('lottie-web')
          ) {
            return 'motion'
          }

          if (id.includes('media-chrome')) {
            return 'video-media-chrome'
          }

          if (
            id.includes('media-tracks') ||
            id.includes('castable-video') ||
            id.includes('custom-media-element')
          ) {
            return 'video-media-core'
          }

          if (id.includes('hls.js')) {
            return 'video-hls'
          }

          if (id.includes('mux-embed')) {
            return 'video-mux-embed'
          }

          if (id.includes('@mux/')) {
            return 'video-mux'
          }

          if (id.includes('node_modules/.pnpm/axios@') || id.includes('/axios/')) {
            return 'http-axios'
          }

          if (id.includes('node_modules/.pnpm/swr@') || id.includes('/swr/')) {
            return 'data-swr'
          }

          if (id.includes('node_modules/.pnpm/i18next') || id.includes('react-i18next')) {
            return 'i18n-core'
          }

          if (id.includes('node_modules/.pnpm/moment@') || id.includes('/moment/')) {
            return 'date-moment'
          }

          if (id.includes('node_modules/.pnpm/lodash@') || id.includes('/lodash/')) {
            return 'lodash-utils'
          }

          if (id.includes('@iconify')) {
            return 'iconify'
          }

          if (id.includes('node_modules/.pnpm/react@') || id.includes('node_modules/react/')) {
            return 'react-core'
          }

          if (
            id.includes('node_modules/.pnpm/@tanstack+react-query') ||
            id.includes('@tanstack/react-query')
          ) {
            return 'react-query'
          }
        },
      },
    },
  },

  plugins: [svgr(), react()],
  server: {
    host: '0.0.0.0',
    port: 5757,
    strictPort: false,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3739',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
