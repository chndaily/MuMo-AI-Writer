import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './theme/index.css'
import { initializeDatabase } from '@/services/index'
import AntdConfig from './theme/antd/index.tsx'

// 初始化应用
const initAndRender = async () => {
  try {
    console.log('开始初始化应用...')
    // 在渲染应用前初始化IndexDB
    const dbInitialized = await initializeDatabase()
    console.log('数据库初始化结果:', dbInitialized)

    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <AntdConfig>
          <App />
        </AntdConfig>
      </React.StrictMode>,
    )
    console.log('应用渲染完成')
  } catch (error) {
    console.error('应用初始化失败:', error)
    // 显示错误信息
    const rootElement = document.getElementById('root')
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-family: Arial, sans-serif;
          color: #ff4d4f;
          text-align: center;
          padding: 20px;
          background-color: #f5f5f5;
        ">
          <div>
            <h2>应用初始化失败</h2>
            <p>请刷新页面重试，或检查浏览器是否支持IndexDB</p>
            <p style="font-size: 12px; color: #999;">错误信息: ${error instanceof Error ? error.message : '未知错误'}</p>
            <button onclick="window.location.reload()" style="
              margin-top: 16px;
              padding: 8px 16px;
              background-color: #1890ff;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            ">刷新页面</button>
          </div>
        </div>
      `
    }
  }
}

// 启动应用
console.log('开始启动应用...')
initAndRender()