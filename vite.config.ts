import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { loadEnv } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  
  return {
    base: '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '#': path.resolve(__dirname, './types'),
      },
    },
    server: {
      host: 'localhost',
      port: 3030,
      open: true,
      proxy: {
        // 代理API请求
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:3001',
          changeOrigin: true,
        },
        // 代理OpenAI API请求
        '/openai': {
          target: 'https://api.openai.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/openai/, ''),
          headers: {
            // 可以在这里添加必要的请求头
            'Content-Type': 'application/json',
          },
        },
        // 代理DeepSeek API请求
        '/deepseek': {
          target: 'https://api.deepseek.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/deepseek/, ''),
          headers: {
            'Content-Type': 'application/json',
          },
        },
        // 代理Anthropic API请求
        '/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/anthropic/, ''),
          headers: {
            'Content-Type': 'application/json',
          },
        },
        // 代理Google API请求
        '/google': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/google/, ''),
          headers: {
            'Content-Type': 'application/json',
          },
        },
        // 代理Ollama本地模型请求
        '/ollama': {
          target: env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ollama/, ''),
        },
        // 代理ModelScope API请求
        '/modelscope': {
          target: 'https://api-inference.modelscope.cn',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/modelscope/, ''),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    define: {
      'import.meta.glob': 'undefined',
    },
  }
})