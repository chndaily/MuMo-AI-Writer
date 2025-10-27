// Icon 组件文件
import React from 'react';

interface IconifyProps {
  icon: string;
  size?: number;
  color?: string;
}

export const Iconify: React.FC<IconifyProps> = ({ icon, size = 16, color }) => {
  // 这是一个简化的图标组件
  return (
    <span 
      style={{ 
        fontSize: size, 
        color: color || 'inherit',
        display: 'inline-block',
        width: size,
        height: size
      }}
    >
      ⭐
    </span>
  );
};

export default Iconify;