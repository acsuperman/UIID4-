import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      proxy: {
        '/v2': {
          target: env.VITE_DOMAIN,
          changeOrigin: true,
        },
        "/get-region": {
          target: "https://apia.coolkit.cn/v2/utils/",
          changeOrigin: true,
        },
        "/dispatch/app": {
          target: "https://cn-dispa.coolkit.cn/",
          changeOrigin: true,
        },
        "/ws": {
          target: "wss://cn-pconnect4.coolkit.cc",
          changeOrigin: true,
          ws: true,
          rewrite: () => "/",
        }
      },
    },
  }
})
