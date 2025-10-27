import React from 'react';
import { Outlet } from 'react-router-dom';
import { Button, Layout } from 'antd';
import classNames from 'classnames';

import useStyles from './useStyles';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

import SettingsModal from '@/pages/Settings/modal';


const NovelLayout: React.FC = () => {
  const { styles } = useStyles();

  return (
    <Layout className={classNames(styles.novelWorkspace, "flex-row h-screen")}>
      <Sidebar className={styles.novelWorkspaceSidebar} />
      <Layout className="flex flex-col overflow-hidden flex-1 h-screen">
        {/* 顶部导航栏 */}
        <TopNav />
        
        <Layout className="flex-1 overflow-hidden h-full">
          <main className={"flex-1 overflow-hidden contain-strict h-full bg-white"}>
            <div className='h-full overflow-hidden flex flex-col @container contain-strict'>
              <div className="flex-1 overflow-hidden">
                <Outlet />
              </div>
            </div>
          </main>
        </Layout>
      </Layout>
      <SettingsModal />
    </Layout>
  );
};


export default NovelLayout;