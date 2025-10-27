import { InputType, PromptInputSchema } from "#/promptInput"
import { PromptCollection } from "#/promptLibrary"
import { useState } from "react"
import { clone } from "ramda"
import { Alert, Button, Checkbox, Dropdown, Input, Radio, Space, Tag, Tooltip, Typography } from "antd"
import { EllipsisVerticalIcon, LinkIcon, TriangleAlertIcon } from "lucide-react"
import { CollapseCard } from "@/components/collapse"
import { PromptInputDefine } from "@/components/inputs"

const inputGroup = {
  custom: ['text', 'dropdown'] as InputType[],
  context: ['act', 'chapter', 'codex', 'fullNovel', 'label', 'scene', 'snippet'] as InputType[],
  checkbox: ['checkbox'] as InputType[],
}

const PromptAdvanced: React.FC<{ collection: PromptCollection }> = ({ collection }) => {
  const [inputs, setInputs] = useState<PromptCollection['inputs']>(clone(collection.inputs))

  const onInputChangeByKey = <T extends keyof PromptInputSchema>(id: string, key: T, value: PromptInputSchema[T]) => {
    setInputs(prev => {
      if (!prev) return prev
      const newInputs = clone(prev)
      newInputs[id][key] = value
      return newInputs
    })
  }

  const onInputChange = (values: PromptInputSchema) => {
    setInputs(prev => {
      if (!prev) return prev
      const newInputs = clone(prev)
      newInputs[values.id] = values
      return newInputs
    })
  }

  const handleSave = () => {
  }


  return <div className="h-full overflow-auto flex flex-col @5xl:flex-row px-6 gap-6">
    <div className="basis-1/2 py-6 space-y-6 max-w-[50rem]">
      <fieldset>
        <legend><Typography.Title level={5} className="mb-1">输入</Typography.Title></legend>
        <Typography.Paragraph className="text-sm/4"> 在指令或包含的组件中被调用的输入: </Typography.Paragraph>
        <div className="flex flex-col gap-1.5">
          {Object.values(inputs ?? {}).map((inputForm, index) => (
            <CollapseCard key={inputForm.id}
              defaultContent={
                <Space>
                  <span>{inputForm.name}</span>
                  <Tag> {inputForm.mode === 'multiple' ? '多选' : '单选'} </Tag>
                  {inputForm.required && <Tag> 必填 </Tag>}
                </Space>
              }
              actions={
                <>
                  {index === 2 && <Tooltip title="该组件没包含在提示词中">
                    <TriangleAlertIcon className="self-center text-warning" size={20} />
                  </Tooltip>}
                  {index > 2 && <Tooltip title="该组件为其他提示词组件">
                    <LinkIcon className="self-center text-blue-500" size={20} />
                  </Tooltip>}
                  <Dropdown menu={{
                    items: [
                      {
                        label: '删除',
                        key: 'delete',
                      }
                    ]
                  }}>
                    <Button size="small" type="text" icon={<EllipsisVerticalIcon size={16} />} />
                  </Dropdown>
                </>
              }
            >
              <div className="flex flex-col gap-1.5">
                {index === 2 && <Alert message="该组件没包含在提示词中" type="warning" />}
                <div className='flex gap-4 py-1 flex-col pb-2'>
                  <div className='flex gap-x-2 gap-y-4 flex-col @xl:flex-row'>
                    <fieldset className='flex-1'>
                      <legend className='font-medium mb-2 whitespace-nowrap '>名称</legend>
                      <Input
                        value={inputForm.name}
                        onChange={e => onInputChangeByKey(inputForm.id, 'name', e.target.value)}
                        onBlur={handleSave}
                      />
                    </fieldset>
                    <fieldset className='flex-1'>
                      <legend className='font-medium mb-2 whitespace-nowrap '>描述</legend>
                      <Input
                        value={inputForm.description}
                        onChange={e => onInputChangeByKey(inputForm.id, 'description', e.target.value)}
                        onBlur={handleSave}
                      />
                    </fieldset>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex  gap-2 items-baseline">
                      <Checkbox checked={inputForm.mode === 'multiple'} onChange={e => onInputChangeByKey(inputForm.id, 'mode', e.target.checked ? 'multiple' : 'single')} />
                      <div>
                        <p className="font-medium">允许多选</p>
                        <p className="text-secondary">例如：角色列表、地点列表或标签列表。</p>
                      </div>
                    </div>
                    <div className="flex  gap-2 items-baseline">
                      <Checkbox checked={inputForm.required} onChange={e => onInputChangeByKey(inputForm.id, 'required', e.target.checked)} />
                      <div>
                        <p className="font-medium">必填项</p>
                        <p className="text-secondary">没有此输入时提示词无法工作，会阻止发送给AI。</p>
                      </div>
                    </div>
                    <div className="flex  gap-2 items-baseline">
                      <Checkbox checked={inputForm.hideInput} onChange={e => onInputChangeByKey(inputForm.id, 'hideInput', e.target.checked)} />
                      <div>
                        <p className="font-medium">仅在"生成文本"中显示</p>
                        <p className="text-secondary">在章节或聊天消息上方隐藏此输入。</p>
                      </div>
                    </div>

                  </div>
                  <div className="mt-2 mb-2">
                    <Typography.Text className="font-medium text-base">允许的内容</Typography.Text>
                    <Typography.Paragraph>您的输入可能包含多种类型的内容（如章节和片段）。</Typography.Paragraph>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-baseline">
                        <Radio
                          checked={inputGroup.custom.includes(inputForm.types[0])}
                          onChange={e => onInputChangeByKey(inputForm.id, 'types', e.target.checked ? inputGroup.custom : [])} />
                        <div className="flex-grow overflow-auto">
                          <div>
                            <p className="font-medium">自定义内容</p>
                            <p className="text-secondary">允许输入与特定内容类型无关的额外信息。</p>
                          </div>
                          {inputGroup.custom.map(type => (
                            <PromptInputDefine key={type} type={type} inputOption={inputForm} onChange={onInputChange} />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-baseline mt-2">
                        <Radio
                          checked={inputGroup.context.includes(inputForm.types[0])}
                          onChange={e => onInputChangeByKey(inputForm.id, 'types', e.target.checked ? inputGroup.context : [])} />
                        <div>
                          <div>
                            <p className="font-medium">内容选择</p>
                            <p className="text-secondary">从基于您当前小说/系列的选项列表中选择。</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex  items-baseline mt-2">
                        <Radio
                          checked={inputGroup.checkbox.includes(inputForm.types[0])}
                          onChange={e => onInputChangeByKey(inputForm.id, 'types', e.target.checked ? inputGroup.checkbox : [])} />
                        <div>
                          <p className="font-medium">复选框</p>
                          <p className="text-secondary">在输入旁边显示一个小复选框。</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CollapseCard>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend><Typography.Title level={5} className="mb-1">包含的组件</Typography.Title></legend>
        <Typography.Paragraph className="text-sm/4"> 在指令中包含的组件: </Typography.Paragraph>
      </fieldset>
    </div>
    <div className="basis-1/2 max-h-[100cqh] py-6 flex flex-col">
      <Typography.Title level={4} className="mb-2" >预览</Typography.Title>
      <div className="flex flex-col gap-4 @container contain-content h-full grow overflow-auto border-1 rounded-md">
        <div className="p-4 flex flex-col gap-4">
          <fieldset>
            <legend><Typography.Title level={5} className="mb-2">新输入</Typography.Title></legend>
          </fieldset>
        </div>
      </div>
    </div>
  </div>
}

export default PromptAdvanced