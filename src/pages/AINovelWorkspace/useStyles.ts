import { createStyles } from 'antd-style'

const useStyles = createStyles(({ css, token }) => ({ 
  workspace: css`
    min-height: 100vh;
    background: #f5f5f5;
    display: flex;
    flex-direction: column;
    
    .workspace-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: #fff;
      border-bottom: 1px solid #f0f0f0;
      flex-shrink: 0;
      
      .header-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }
    }
    
    .writing-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
      
      .stat-item {
        text-align: center;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        transition: all 0.2s ease;
        
        &:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
      }

      .stat-item .ant-typography {
        display: block;
        margin-bottom: 4px;
      }
    }
    
    .ai-status {
      margin-top: 8px;
    }

    .workspace-layout {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 320px 260px;
      gap: 16px;
      padding: 16px;
      overflow: hidden;
      /* 根据规范调整高度适配 */
      min-height: calc(100vh - 140px);
      
      @media (max-width: 1200px) {
        grid-template-columns: 1fr 300px;
      }
      
      @media (max-width: 992px) {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr auto;
      }
    }
    
    .canvas-area, .control-tower, .navigation-panel {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      min-height: 500px;
      height: 100%;
      transition: all 0.3s ease;
      
      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      }
      
      .area-header {
        padding: 16px 20px;
        border-bottom: 1px solid #f0f0f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
        background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
        border-radius: 12px 12px 0 0;
        
        h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 600;
          color: #1f1f1f;
        }
      }
    }
    
    .canvas-area {
      /* 为创意画布区添加滚动条功能 */
      overflow-y: auto;
      max-height: none;
      height: 100%;
      min-height: 600px;
      
      /* 优化滚动条样式 */
      &::-webkit-scrollbar {
        width: 8px;
      }
      
      &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
        
        &:hover {
          background: #a8a8a8;
        }
      }
    }
    
    .canvas-content {
      flex: 1;
      position: relative;
      min-height: 400px;
      padding: 16px;
      /* 为内容区域添加滚动条功能 */
      overflow-y: auto;
      max-height: none;
      height: 100%;
      
      /* 优化滚动条样式 */
      &::-webkit-scrollbar {
        width: 6px;
      }
      
      &::-webkit-scrollbar-track {
        background: #f8f8f8;
        border-radius: 3px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: #d1d1d1;
        border-radius: 3px;
        
        &:hover {
          background: #b8b8b8;
        }
      }
      
      .ant-input {
        height: 100%;
        /* 修复滚动条问题：设置固定高度而不是使用autoSize */
        min-height: 400px;
        max-height: calc(100vh - 200px);
        border: 1px solid #f0f0f0;
        border-radius: 8px;
        resize: none;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        line-height: 1.6;
        padding: 16px;
        transition: all 0.2s ease;
        overflow-y: auto;
        
        &:focus {
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
          border-color: #1890ff;
        }
        
        &:hover {
          border-color: #40a9ff;
        }
      }
    }
    
    .control-tower {
      overflow-y: auto;
      max-height: none;
      height: 100%;
      min-height: 600px;
      
      /* 优化滚动条样式 */
      &::-webkit-scrollbar {
        width: 8px;
      }
      
      &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
        
        &:hover {
          background: #a8a8a8;
        }
      }
      
      /* 添加控制塔内容区域的样式 */
      .control-content {
        padding: 16px;
        height: 100%;
        overflow-y: auto;
        flex: 1;
        display: flex;
        flex-direction: column;
        
        /* 优化滚动条样式 */
        &::-webkit-scrollbar {
          width: 6px;
        }
        
        &::-webkit-scrollbar-track {
          background: #f8f8f8;
          border-radius: 3px;
        }
        
        &::-webkit-scrollbar-thumb {
          background: #d1d1d1;
          border-radius: 3px;
          
          &:hover {
            background: #b8b8b8;
          }
        }
      }
      
      /* 为实时预览区域添加滚动条样式 */
      .preview-content {
        max-height: 200px !important;
        overflow-y: auto !important;
        margin-bottom: 12px;
        border: 1px solid #f0f0f0;
        border-radius: 4px;
        padding: 8px;
        position: relative;
        
        /* 优化滚动条样式 */
        &::-webkit-scrollbar {
          width: 6px;
        }
        
        &::-webkit-scrollbar-track {
          background: #f8f8f8;
          border-radius: 3px;
        }
        
        &::-webkit-scrollbar-thumb {
          background: #d1d1d1;
          border-radius: 3px;
          
          &:hover {
            background: #b8b8b8;
          }
        }
      }
    }
    
    .navigation-panel {
      .version-history, .immersion-mode, .content-assistant, .character-perspective {
        padding: 20px;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        h5 {
          margin-bottom: 16px;
          font-weight: 600;
          color: #1f1f1f;
          font-size: 15px;
        }
      }
      
      .character-perspective {
        .ant-avatar {
          transition: all 0.2s ease;
          
          &:hover {
            transform: scale(1.1);
          }
        }
      }
    }
    
    .immersion-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.92);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .immersion-content {
        width: 90%;
        max-width: 1000px;
        height: 85vh;
        
        .immersion-canvas {
          background: #1f1f1f !important;
          color: #fff !important;
          border: none !important;
          font-size: 18px !important;
          line-height: 1.8 !important;
          height: 100% !important;
          padding: 32px !important;
          border-radius: 8px !important;
          overflow-y: auto;
        }
      }
    }
    
    /* 响应式优化 */
    @media (max-width: 768px) {
      .workspace-layout {
        grid-template-columns: 1fr;
        padding: 12px;
        gap: 12px;
        min-height: calc(100vh - 100px);
      }
      
      .writing-stats {
        grid-template-columns: repeat(3, 1fr);
      }
      
      .canvas-area, .control-tower, .navigation-panel {
        min-height: auto;
      }
      
      .canvas-content .ant-input {
        max-height: 60vh;
      }
      
      .control-tower .preview-content {
        max-height: 150px;
      }
    }
  `
}))

export default useStyles