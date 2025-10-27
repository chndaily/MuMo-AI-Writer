import { Modal, Tabs } from "antd"
import { useSearchParams } from "react-router-dom"
import LLMSettings from "./modules/LLMSettings"

const SettingsModal = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabActive = searchParams.get('modal[settings]') || undefined
  return <Modal className="max-w-3xl" width={'95%'} open={!!tabActive} onCancel={() => {
    searchParams.delete('modal[settings]')
    setSearchParams(searchParams.toString())
  }}>
    <Tabs activeKey={tabActive} onChange={(key) => {
      searchParams.set('modal[settings]', key)
      setSearchParams(searchParams.toString())
    }}>
      <Tabs.TabPane tab="AI 连接" key="llm">
        <LLMSettings />
      </Tabs.TabPane>
      {/* 隐藏通用、团队、与我共享选项 */}
      {/* <Tabs.TabPane tab="通用" key="general">
        <LLMSettings />
      </Tabs.TabPane>
      <Tabs.TabPane tab="团队" key="teams">
        <LLMSettings />
      </Tabs.TabPane>
      <Tabs.TabPane tab="与我共享" key="shared">
        <LLMSettings />
      </Tabs.TabPane> */}
    </Tabs>
  </Modal>
}

export default SettingsModal