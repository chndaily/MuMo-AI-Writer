import { createStyles } from "antd-style";

const useStyles = createStyles(({ css, token }) => {
  return {
    novelWorkspace: css` 
    display: flex;
    height: 100vh;
    width: 100vw;
    background-color: ${token.colorBgContainer};
  `,
    novelWorkspaceSidebar: css`
      border-color: var(--ant-color-border);
      background: #ffffff;
      
      .collapse-btn, .expand-btn {
        margin-left: auto;
        transition: transform 0.3s ease;
        transform: rotate(0deg);
        
        &.rotate-180 {
          transform: rotate(180deg);
        }
      }
      
      .sidebar-resize {
        position: absolute;
        right: 0;
        top: 12px;
        height: 32px;
        width: 16px;
        border-radius: 4px 0 0 4px;
        color: ${token.colorBorder};
        border-width: 1px 0 1px 1px;
        border-color: ${token.colorBorder};
        cursor: col-resize;
        transition: color 0.2s;
        font-size: 16px;
        align-items: center;
        justify-content: center;

        &:hover {
          color: ${token.colorTextSecondary};
        }
      }

      .sidebar-header-title {
        flex: 1;
        padding: 0 1px;
        transition: all 0.3s;
        border-radius: 6px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-width: 0;
        align-items: center;
        
        .novel-selector {
          width: 100%;
          
          .ant-select-selector {
            padding: 2px 4px 2px 4px !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            border-radius: 6px !important;
            min-height: 28px;
            height: 28px;
            transition: all 0.3s;
            display: flex;
            align-items: center;
          }
          
          .ant-select-selection-item {
            padding: 0 !important;
            width: calc(100% - 24px);
            display: flex;
            align-items: center;
            justify-content: flex-start;
            text-align: left;
            // 保持字体大小为16px
            font-size: 16px;
            font-weight: 500;
            color: ${token.colorText};
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.5;
          }
          
          .ant-select-arrow {
            color: ${token.colorTextSecondary};
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
          }
        }
        
        .novel-option {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 6px 8px;
          border-radius: 4px;
          transition: background-color 0.2s;
          
          &:hover {
            background-color: ${token.colorFillTertiary};
          }
        }
        
        .novel-title {
          // 保持字体大小为16px
          font-size: 16px;
          font-weight: 500;
          color: ${token.colorText};
          padding: 2px 0;
          text-align: left;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        &:hover {
          background-color: ${token.colorFillTertiary};
        }
      }

      .sidebar-tab-active{
        color: ${token.colorPrimary};
        border-color: ${token.colorPrimary};
      }
      
      .sidebar-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .sidebar-list-item {
        display: flex;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        transition: all 0.3s ease;
        cursor: pointer;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        border: 1px solid ${token.colorBorder};
        
        &:hover {
          background-color: ${token.colorFillTertiary};
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }
        
        .avatar-placeholder, .location-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg,rgb(2, 158, 85) 0%,rgb(174, 241, 96) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: white;
          // 设置字体大小为12px
          font-size: 12px;
          flex-shrink: 0;
        }
        
        .sidebar-list-item-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .sidebar-list-item-title {
          font-weight: 600;
          // 设置字体大小为12px
          font-size: 12px;
          margin-bottom: 4px;
          color: ${token.colorText};
        }
        
        .sidebar-list-item-desc {
          // 保持字体大小为10px
          font-size: 10px;
          color: ${token.colorTextSecondary};
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }
    `,
  }
});

export default useStyles;