import React, { useState } from 'react'
import { cn } from '@/utils'
import { RightOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { UnmountClosed } from './UnmountClosed'

interface CollapseCardProps {
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
  /** 默认内容 */
  defaultContent: React.ReactNode,
  defaultContentClassName?: string
  // 操作栏
  actions?: React.ReactNode
  tag?: 'div' | 'li' | 'details'
}
const CollapseCard = ({ children, className, defaultContent, defaultContentClassName, actions, tag, defaultOpen = false }: CollapseCardProps) => {
  const [isOpened, setIsOpened] = useState(defaultOpen)
  const [collapseOpen, setCollapseOpen] = useState(defaultOpen)
  return <div className={cn('shadow-sm p-1 rounded-md border flex items-start gap-2 flex-1', className)}>
    <Button className='w-7 h-7' type='text' icon={<RightOutlined />} onClick={() => {
      if (!isOpened) {
        setIsOpened(true)
      }
      setCollapseOpen(!collapseOpen)
    }} />
    {!isOpened && <div className='grow text-sm self-center items-center flex gap-2 overflow-hidden'>
      <div className={cn('grow text-sm self-center flex items-center gap-2 overflow-hidden', defaultContentClassName)}>
        {defaultContent}
      </div>
      {!!actions && <div className='flex gap-1'>
        {actions}
      </div>}
    </div>}
    <UnmountClosed className='grow' isOpened={collapseOpen} tag={tag} onRest={() => {
      if (!collapseOpen) {
        setIsOpened(false)
      }
    }}>
      {children}
    </UnmountClosed>
    {collapseOpen && !!actions && <div className='flex-col-reverse flex gap-1'>
      {actions}
    </div>}
  </div>
}

export default CollapseCard