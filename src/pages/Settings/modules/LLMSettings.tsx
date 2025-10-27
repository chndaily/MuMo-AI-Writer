import AlIcon from "@/components/icon/AlIcon"
import { Button, Checkbox, Divider, Flex, Form, Input, Tag, Tooltip, Typography } from "antd"
import { CheckCircleOutlined, DeleteOutlined, ExportOutlined, HolderOutlined, LoadingOutlined, QuestionCircleOutlined, ReloadOutlined } from "@ant-design/icons"
import { LLMConnection } from "#/llm"
import { AIServiceType } from "@/ai"
import { useAIServiceStore } from "@/stores/aiServiceStore"
import { ReactSortable } from "react-sortablejs";
import { cn, generateUUID } from "@/utils";
import { createStyles } from "antd-style"
import { useMemo, useState } from "react"


const LLMIcons = {
  [AIServiceType.OpenRouter]: <AlIcon icon="OpenRouter" />,
  [AIServiceType.DeepSeek]: <AlIcon icon="deepseek" className="text-blue-500" />,
  [AIServiceType.OpenAI]: <AlIcon icon="Chatgpt" />,
  [AIServiceType.Ollama]: <AlIcon icon="studio" className="text-blue-500" />,
  [AIServiceType.OpenPipe]: <AlIcon icon="OpenPipe" />,
}
interface LLMProviderItem {
  name: string
  icon: React.ReactNode
  description: string
  recommended: boolean
  link: string
  tag?: string
  tagHint?: string
  provider: AIServiceType
}

const LLMProviders: LLMProviderItem[] = [
  {
    name: 'OpenRouter',
    icon: LLMIcons[AIServiceType.OpenRouter],
    description: '一站式接入所有商用和NSFW模型',
    recommended: true,
    link: 'https://openrouter.ai/',
    provider: AIServiceType.OpenRouter,
  },
  {
    name: 'DeepSeek',
    icon: LLMIcons[AIServiceType.DeepSeek],
    description: '热门模型创造者（如DeepSeek-R1和DeepSeek-V3）',
    recommended: false,
    tag: '模型精调',
    tagHint: '通过专业训练定制专属模型',
    link: 'https://deepseek.com/',
    provider: AIServiceType.DeepSeek,
  },
  {
    name: 'OpenAI',
    icon: LLMIcons[AIServiceType.OpenAI],
    description: '热门模型创造者（如GPT-3.5和GPT-4）',
    recommended: false,
    tag: '模型精调',
    tagHint: '通过专业训练定制专属模型',
    link: 'https://openai.com/',
    provider: AIServiceType.OpenAI,
  },
  {
    name: 'Local LLM',
    icon: LLMIcons[AIServiceType.Ollama],
    description: '发现、下载并运行本地LLM。',
    recommended: false,
    tag: '本地模型',
    link: 'https://llmstudio.ai/',
    provider: AIServiceType.Ollama
  },
  // {
  //   name: 'Ollama',
  //   icon: <AlIcon icon="ollama" />,
  //   description: '运行本地LLM。',
  //   recommended: false,
  //   tag: '本地模型',
  //   link: 'https://ollama.ai/',
  // }
]

const LLMSettings = () => {
  const { styles } = useStyles()
  const [selectedId, setSelectedId] = useState<string>()
  const {
    connections,
    loadingModels,
    addConnection,
    updateConnection,
    removeConnection,
    getConnection,
    getAllConnections,
    refreshModel,
    refreshAllModels,
    connectionModels
  } = useAIServiceStore()

  const selected = useMemo(() => {
    return connections.find((item) => item.id === selectedId)
  }, [connections, selectedId])

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // updateConnection({
    //   ...selected,
    //   name: e.target.value
    // })
  }

  const ConnectionTagNode = ({ item }: { item: LLMConnection }) => {
    if (loadingModels.includes(item.id)) {
      return <div className="flex justify-end items-center gap-1 text-xs text-secondary"><LoadingOutlined /> 加载中...</div>
    }
    if (item.disabled) {
      return <span className="text-xs truncate">已禁用</span>
    }
    return <span className="text-xs truncate">{connectionModels[item.provider].length > 0 ? `${connectionModels[item.provider].length}个模型` : '无模型'}</span>
  }

  return <div className={styles}>
    <Typography.Title level={5}>管理您的AI供应商</Typography.Title>
    <Typography.Paragraph className="mb-4" type="secondary">此处显示当前浏览器中所有已连接的AI服务商。您可通过右侧栏目添加或编辑新的供应商配置。</Typography.Paragraph>
    <div className="grid grid-cols-1 sm:grid-cols-3 h-[42rem] overflow-hidden border-y sm:border-x sm:rounded-lg divide-y sm:divide-y-0 sm:divide-x shadow-sm -mx-6 md:mx-0">
      <div className={cn("flex overflow-hidden flex-col", selected && "hidden sm:flex")}>
        <Flex align="center" justify="space-between" className="px-2 py-1.5 bg-collapse-header border-b">
          <div className="text-sm text-secondary">已连接</div>
          <Button>新增AI供应商</Button>
        </Flex>
        <ReactSortable
          className="connections-wrap"
          handle=".sortable-handle"
          animation={300}
          delay={100}
          chosenClass={'select-list-color'} // 被选中项的css 类名
          dragClass={'drag-list-color'} // 正在被拖拽中的css类名
          list={connections}
          setList={(list) => {
            console.log(list)
          }}
        >
          {connections.map((item) => (
            <div key={item.id}>
              <Flex
                className={cn("select-none connection-item mx-[3px] p-2 rounded cursor-pointer", selected?.id === item.id && "active")}
                align="center"
                gap={10}
                onClick={() => {
                  if (selected?.id === item.id) {
                    setSelectedId(undefined)
                  } else {
                    setSelectedId(item.id)
                  }
                }}
              >
                <HolderOutlined className="sortable-handle text-lg cursor-grab flex-none p-1 rounded border-1 border-transparent hover:border-theme-border" />
                <span className="text-xl">{LLMIcons[item.provider]}</span>
                <Flex vertical gap={4} flex={1} className="overflow-hidden">
                  <span className="truncate" title={item.name}>{item.name}</span>
                  <ConnectionTagNode item={item} />
                </Flex>
              </Flex>
            </div>
          ))}
        </ReactSortable>
      </div>
      {!selected && <div className="col-span-2 overflow-y-auto flex flex-col">
        {LLMProviders.map((provider) => (
          <div key={provider.name}>
            {/* {!!index && <Divider className="my-5" />} */}
            <div className="flex items-start gap-3 px-2 py-1.5 border-b">
              <div className="text-2xl">{provider.icon}</div>
              <div className="grow text-sm flex flex-col items-start text-left">
                <Flex align="center" gap={16}>
                  <strong className="font-semibold leading-none">{provider.name}</strong>
                  {provider.recommended && <span className=" text-amber-600 text-xs"><AlIcon icon="xingxing" /> 推荐</span>}
                </Flex>
                <div className="text-secondary mt-1">
                  {provider.description}
                </div>
                <div className="mt-2 mb-1 text-xs font-semibold text-success"><CheckCircleOutlined className="mr-1" />您已使用该供应商</div>
                <div className="flex items-center gap-2 mt-2">
                  {provider.tag && <Tag>
                    <span>{provider.tag}</span>
                    {provider.tagHint && <Tooltip title={provider.tagHint}>
                      <QuestionCircleOutlined className="ml-1" />
                    </Tooltip>}
                  </Tag>}
                  <Typography.Link href={provider.link} className="flex items-center gap-1 text-secondary">
                    <ExportOutlined />
                    官方网站
                  </Typography.Link>
                </div>
              </div>
              <div className="flex flex-col gap-2 self-center">
                <Button>连接</Button>
                <Button type="text"
                  onClick={() => {
                    addConnection({
                      name: provider.name,
                      provider: provider.provider,
                      id: generateUUID(),
                      disabled: false,
                      baseUrl: ''
                    })
                  }}
                >添加</Button>
              </div>
            </div>
          </div>
        ))}
      </div>}
      {
        !!selected && <div className="col-span-full sm:col-span-2 overflow-hidden flex flex-col">
          <Flex className="px-2 py-1.5 bg-collapse-header border-b" justify="space-between">
            <Flex align="center" gap={10}>
              <Button className="sm:hidden">关闭</Button>
              <span className="text-xl">{LLMIcons[selected.provider]}</span>
              <strong>{selected.name}</strong>
            </Flex>
            <Flex align="center">
              <Checkbox checked={selected.disabled} onChange={(e) => {
                updateConnection({
                  ...selected,
                  disabled: e.target.checked
                })
              }}>禁用</Checkbox>
              <Button type="text" icon={<DeleteOutlined />} onClick={() => {
                removeConnection(selected)
              }}>删除</Button>
              <Button type="text" loading={loadingModels.includes(selected.id)} icon={<ReloadOutlined />} onClick={() => {
                refreshModel(selected)
              }}>刷新</Button>
            </Flex>
          </Flex>
          <div className="flex flex-col gap-4 p-3 overflow-y-auto grow">
            <div>
              <div className="text-sm mb-1">连接名称</div>
              <div className="text-xs font-sans text-secondary mb-2">给您的连接起一个名字，方便您识别。</div>
              <Input maxLength={20} value={selected.name} placeholder="请输入连接名称" onChange={(e) => {
                updateConnection({
                  ...selected,
                  name: e.target.value
                })
              }} />
            </div>
            <div>
              <div className="text-sm mb-1">API密钥</div>
              <div className="text-xs font-sans text-secondary mb-2">请输入您的API密钥，以便应用能够正常使用。</div>
              <Input type="password" value={selected.apiKey} placeholder="请输入API密钥" onChange={(e) => {
                updateConnection({
                  ...selected,
                  apiKey: e.target.value
                })
              }} />
            </div>
            <div>
              <div className="text-sm mb-1">Base URL</div>
              <div className="text-xs font-sans text-secondary mb-2">请输入您的Base URL，以便应用能够正常使用。</div>
              <Input value={selected.baseUrl} placeholder="请输入Base URL" onChange={(e) => {
                updateConnection({
                  ...selected,
                  baseUrl: e.target.value
                })
              }} />
            </div>
            <div>
              <div className="text-sm mb-1">可用模型</div>
              {!connectionModels[selected.provider].length && <div className="bg-collapse-header p-3 text-sm rounded-lg border border-dashed text-center">
                <Typography.Text type="secondary" strong>未找到模型</Typography.Text>
                <Typography.Paragraph type="secondary" className="mb-0">
                  请检查连接配置是否正确，或者供应商没有返回任何型号。
                </Typography.Paragraph>
              </div>}
              {!!connectionModels[selected.provider].length && <div className="flex gap-0.5 flex-wrap">
                {connectionModels[selected.provider].map((item) => (
                  <span key={item.name} className="bg-zinc-800/5 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400 cursor-default select-none inline-flex items-center rounded-md px-2 py-1 text-xs font-medium relative group/badge [word-break:break-word]">{item.name}</span>
                ))}
              </div>}
            </div>
          </div>
        </div>
      }
    </div>
  </div>
}


const useStyles = createStyles(({ css, token }) => (
  css`
    .connection-item:hover {
      background-color: ${token.colorFillTertiary};
    }
    .connection-item.active {
      box-shadow: 0 0 0 2px ${token.colorPrimary};
    }

    .select-list-color {
      box-shadow: 0 2px 5px ${token.colorPrimary};
      z-index: 9999;
    }

    .drag-list-color {
      background-color: ${token.colorPrimary};
    }
    `
))

export default LLMSettings