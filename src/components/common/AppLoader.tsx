import React from 'react'
import { Spin, Typography } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { createStyles } from 'antd-style'

const { Text } = Typography

interface AppLoaderProps {
  message?: string
}

const useStyles = createStyles(({ css }) => ({
  loading: css`
    @keyframes gradientShift {
      0% {
        background-position: 0% 50%;
      }

      50% {
        background-position: 100% 50%;
      }

      100% {
        background-position: 0% 50%;
      }
    }
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: linear-gradient(135deg, #cbfae5 0%, #e7d7fd 50%, #daedf5 100%);
    animation: gradientShift 5s ease infinite;
    background-size: 200% 200%;
  `,
}))

export const AppLoader: React.FC<AppLoaderProps> = ({ 
  message = '木墨文坊加载中...' 
}) => {
  const { styles } = useStyles()
  return (
    <div className={styles.loading}>
      <Spin 
        indicator={<LoadingOutlined style={{ fontSize: 48, color: '#fff' }} spin />}
        size="large"
      />
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Text style={{ fontSize: 16, color: '#fff' }}>
          {message}
        </Text>
        <br />
        <Text style={{ fontSize: 12, color: '#ffffff', marginTop: 8 }}>
          正在初始化数据库...
        </Text>
      </div>
    </div>
  )
} 