import React from 'react';
import { Drawer, Tabs, List, Typography } from 'antd';

const { TabPane } = Tabs;

interface InspirationPanelProps {
  showInspirationPanel: boolean;
  onClose: () => void;
}

const InspirationPanel: React.FC<InspirationPanelProps> = ({
  showInspirationPanel,
  onClose
}) => {
  return (
    <Drawer
      title="创作灵感"
      placement="right"
      onClose={onClose}
      open={showInspirationPanel}
      width={400}
    >
      <Tabs defaultActiveKey="1">
        <TabPane tab="写作技巧" key="1">
          <List
            dataSource={[
              '使用具体而非抽象的描述',
              '展示而非告诉',
              '运用五感描写',
              '制造冲突和悬念',
              '塑造立体角色'
            ]}
            renderItem={item => (
              <List.Item>
                <Typography.Text mark>[技巧]</Typography.Text> {item}
              </List.Item>
            )}
          />
        </TabPane>
        <TabPane tab="情节构思" key="2">
          <List
            dataSource={[
              '三卷式结构',
              '英雄之旅',
              '反转与意外',
              '伏笔与呼应',
              '高潮与结局'
            ]}
            renderItem={item => (
              <List.Item>
                <Typography.Text mark>[构思]</Typography.Text> {item}
              </List.Item>
            )}
          />
        </TabPane>
        <TabPane tab="角色塑造" key="3">
          <List
            dataSource={[
              '角色动机与目标',
              '内心冲突',
              '成长弧线',
              '对话个性化',
              '细节刻画'
            ]}
            renderItem={item => (
              <List.Item>
                <Typography.Text mark>[角色]</Typography.Text> {item}
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>
    </Drawer>
  );
};

export default InspirationPanel;