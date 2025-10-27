import React from 'react';

const EmptyDetail: React.FC = () => {
  return <div className='grow bg-layout p-1 @sm:p-2 @md:p-3 justify-center items-start @6xl:pb-64 @6xl:items-center'>
    <div className='grid gap-1 @md:gap-3 @3xl:grid-cols-2 @6xl:grid-cols-3 @5xl:gap-4 max-w-[90rem] min-w-0 w-full'>
      <hgroup className='col-span-full py-2 @2xl:py-8 text-center'>
        <h1 className='text-main text-xl @2xl:text-2xl tracking-tight font-medium'>您的提示词和预设 </h1>
        <p className='@2xl:text-lg mt-2 text-secondary text-balance max-w-2xl mx-auto'>
          欢迎来到您的提示词库！在这里您可以创建、编辑和管理您的提示词和预设。
        </p>
      </hgroup>
      <div className='p-6 rounded-lg border min-w-0 bg-container shadow-sm flex flex-col'>
        <hgroup>
          <h3 className='text-main font-semibold uppercase tracking-wide mb-2'>最近使用</h3>
          <p className='mb-4 mt-2 text-pretty text-secondary'>
            从本次会话中访问您最近使用的提示词。
          </p>
        </hgroup>
        <div className='bg-layout p-3 gap-2 rounded-lg border border-dashed text-center'>
          <h4 className="text-main font-semibold">没有最近使用的提示词。</h4>
          <p className='text-secondary'>
            开始聊天、使用场景、扩展文本等！
          </p>
        </div>
      </div>
    </div>
  </div>;
};

export default EmptyDetail;