import React from 'react';
import '@/assets/iconfont/iconfont.css';

// iconfont 是json文件，需要转换为ts类型

const AlIcon: React.FC<{ icon: string, size?: number, className?: string }> = ({ icon, size, className }) => {
  return (
    <i className={`iconfont icon-${icon} ${className}`} style={{ fontSize: size }} />
  );
}

export default AlIcon;