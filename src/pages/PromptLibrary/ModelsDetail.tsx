import { Button, Checkbox, Input, InputNumber } from 'antd';
import { DeleteOutlined, HolderOutlined, IeOutlined, MoreOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { CopyIcon, ClipboardIcon, ClipboardPasteIcon } from 'lucide-react';
import { cn, generateUUID } from '@/utils';
import { createStyles } from 'antd-style';
import { ModelCollection, PromptModel } from '#/promptLibrary';
import { CollapseCard } from '@/components/collapse';
import { clone } from 'ramda';

const useStyles = createStyles(({ css }) => {
  return {
    details: css`
    summary .anticon{
      transition: transform 0.3s ease-in-out;
    }
    &[open] {
      summary .anticon {
        transform: rotate(90deg);
      }
    }
  `
  }
})


const FieldItem: React.FC<{ title: string, description: string, control: React.ReactNode }> = (props) => {
  return <>
    <div className="text-sm font-medium col-span-full @xl:col-span-1 mt-2 @xl:mt-0">{props.title}</div>
    <div className='flex items-center gap-2'>
      {props.control}
    </div>
    <div className="text-xs opacity-70">{props.description}</div>
  </>
}


interface ModelsDetailProps {
  collection: ModelCollection
}

const ModelsDetail: React.FC<ModelsDetailProps> = ({ collection }) => {
  const { styles } = useStyles();

  const [formData, setFormData] = useState<ModelCollection['attributes']>(clone(collection.attributes))
  const [mapOrRouting, setMapOrRouting] = useState<Record<string, string>>(formData.models.reduce((acc, model) => {
    acc[model.internalId] = model.orRouting?.join(', ') ?? ''
    return acc
  }, {} as Record<string, string>))

  const onChangeModel = <T extends keyof PromptModel>(internalId: string, key: T, value: PromptModel[T]) => {
    const newModels = [...formData.models]
    const index = newModels.findIndex(model => model.internalId === internalId)
    if (index !== -1) {
      newModels[index][key] = value
    }
    setFormData({ ...formData, models: newModels })
  }

  const handleSave = () => {
    console.log(formData)
  }

  const onAddModel = () => {
    const newModels = [...formData.models]
    newModels.push({
      internalId: generateUUID({ prefix: collection.id.slice(0, 4), length: 28 }),
      name: '',
      id: ''
    })
    setFormData({ ...formData, models: newModels })
  }

  return <div className='flex flex-col overflow-hidden'>
    <div className="flex gap-4 border-b p-1.5 shadow-sm">
      <div className="min-w-0 flex items-center gap-4 grow pl-2">
        <div className="font-medium whitespace-nowrap">
          <span className="truncate">名称（Name）</span>
        </div>
        <Input
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          onBlur={handleSave}
        />
      </div>
      <Button className='text-xl font-medium' type="text" icon={<MoreOutlined />} />
    </div>
    <div className='grow overflow-y-auto p-1 @sm:p-2 @md:p-3 bg-layout'>
      <div className='flex flex-col gap-1 @sm:gap-2 @md:gap-3 max-w-3xl'>

        <div className='p-6 rounded-lg  border  bg-container shadow-sm'>
          <h3 className="font-semibold uppercase tracking-wide mb-2">模型（Models）</h3>
          <p className="mb-4 mt-2 text-secondary text-pretty"> 每个提示至少需要一个模型才能运行，但您可以使用不同的模型来获得不同的风味输出。 </p>
          <ul className='flex flex-col gap-1.5'>
            {formData.models.map((model) =>
              <li key={model.internalId} className='dnd-ai-model flex items-start gap-1'>
                <Button className='w-6 mt-[3px] text-lg' type='text' icon={<HolderOutlined />} />
                <CollapseCard
                  defaultOpen={!collection.attributes.models.some(m => m.internalId === model.internalId)}
                  className='ai-model'
                  defaultContent={
                    <>
                      <span className='grow overflow-hidden flex gap-x-2 hover:underline focus:underline cursor-pointer whitespace-nowrap'>
                        <span className="font-medium text-ellipsis overflow-hidden shrink-0 max-w-full empty:hidden">{model.name}</span>
                        <span className="text-secondary text-ellipsis overflow-hidden shrink basis-auto min-w-0 empty:hidden">{model.id}</span>
                      </span>
                      <Button className='h-7 py-1 px-1.5 gap-1' type='text'><IeOutlined />详情（Details）</Button>
                    </>
                  }
                  actions={
                    <>
                      <Button className='w-7 h-7' type='text' icon={<ClipboardIcon size={14} />} title='复制到剪贴板（Copy to Clipboard）' />
                      <Button className='w-7 h-7' type='text' icon={<CopyIcon size={14} />} title='克隆模型（Clone Model）' />
                      <Button className='w-7 h-7' type='text' icon={<DeleteOutlined />} title='删除（Delete）' />
                    </>
                  }
                >
                  <div className='flex gap-2 py-1 flex-col'>
                    <div className='flex gap-x-2 gap-y-4 flex-col @xl:flex-row'>
                      <fieldset className='flex-1'>
                        <legend className='font-medium mb-2 whitespace-nowrap '>名称（Name）</legend>
                        <Input
                          value={model.name}
                          onChange={e => onChangeModel(model.internalId, 'name', e.target.value)}
                          onBlur={handleSave}
                        />
                      </fieldset>
                      <fieldset className='flex-1'>
                        <legend className='font-medium mb-2 whitespace-nowrap '>模型（Model）</legend>
                        <Input
                          value={model.id}
                          onChange={e => onChangeModel(model.internalId, 'id', e.target.value)}
                          onBlur={handleSave}
                        />
                      </fieldset>
                    </div>
                    <div className='my-2 grid gap-y-2 gap-x-4 grid-cols-1 @xl:grid-cols-[max-content_7rem_auto] items-center'>
                      <FieldItem
                        title='Temperature'
                        description='控制创造性（0 = 确定性，1 = 随机）。（Control creativity (0 = deterministic, 1 = random)。）'
                        control={<>
                          <Checkbox checked={model.temperature !== undefined}
                            onChange={e => onChangeModel(model.internalId, 'temperature', e.target.checked ? 0 : undefined)}
                          />
                          <InputNumber max={1} min={0} step={0.1} precision={1} value={model.temperature} onChange={e => onChangeModel(model.internalId, 'temperature', e ?? 0)} onBlur={handleSave} /></>}
                      />

                      <FieldItem
                        title='Top P'
                        description='控制采样时的累积概率上限（0 到 1）。（Control the cumulative probability upper limit during sampling (0 to 1)。）'
                        control={<>
                          <Checkbox checked={model.topP !== undefined}
                            onChange={e => onChangeModel(model.internalId, 'topP', e.target.checked ? 0 : undefined)}
                          />
                          <InputNumber max={1} min={0} step={0.1} precision={1} value={model.topP} onChange={e => onChangeModel(model.internalId, 'topP', e ?? 0)} onBlur={handleSave} /></>}
                      />
                      <FieldItem
                        title='Max. Tokens'
                        description='生成时可使用的最大 Token 数。（Maximum number of Tokens that can be used during generation.）'
                        control={<>
                          <Checkbox checked={model.maxTokens !== undefined}
                            onChange={e => onChangeModel(model.internalId, 'maxTokens', e.target.checked ? 0 : undefined)}
                          />
                          <InputNumber max={128000} min={0} step={1000} precision={0} value={model.maxTokens} onChange={e => onChangeModel(model.internalId, 'maxTokens', e ?? 0)} onBlur={handleSave} /></>}
                      />
                      <FieldItem
                        title='Freq. Penalty'
                        description='降低高频重复词的概率。（Reduce the probability of high-frequency repeated words.）'
                        control={<>
                          <Checkbox checked={model.frequencyPenalty !== undefined}
                            onChange={e => onChangeModel(model.internalId, 'frequencyPenalty', e.target.checked ? 0 : undefined)}
                          />
                          <InputNumber max={2} min={-2} step={0.1} precision={1} value={model.frequencyPenalty} onChange={e => onChangeModel(model.internalId, 'frequencyPenalty', e ?? 0)} onBlur={handleSave} /></>}
                      />
                      <FieldItem
                        title='Pres. Penalty'
                        description='鼓励模型生成更具多样性的响应。（Encourage the model to generate more diverse responses.）'
                        control={<>
                          <Checkbox checked={model.presencePenalty !== undefined}
                            onChange={e => onChangeModel(model.internalId, 'presencePenalty', e.target.checked ? 0 : undefined)}
                          />
                          <InputNumber max={2} min={-2} step={0.1} precision={1} value={model.presencePenalty} onChange={e => onChangeModel(model.internalId, 'presencePenalty', e ?? 0)} onBlur={handleSave} /></>}
                      />

                    </div>

                    <details className={cn(styles.details, 'border rounded-md p-0.5 contain-content -mx-2')}>
                      <summary className='cursor-pointer hover:bg-layout flex list-none items-center justify-between p-1.5 rounded'>
                        <span className='font-semibold grow flex overflow-ellipsis overflow-hidden'>高级设置（Advanced Settings）</span>
                        <RightOutlined />
                      </summary>
                      <div className='mt-0.5 p-1.5 flex flex-col gap-4'>
                        <div className='grid gap-y-2 gap-x-4 grid-cols-1 @xl:grid-cols-[max-content_7rem_auto] items-center'>
                          <FieldItem
                            title='Min P'
                            description='Top P 的替代方案，控制最小概率（0 到 1）。（An alternative to Top P that controls the minimum probability (0 to 1)。）'
                            control={<>
                              <Checkbox checked={model.minP !== undefined}
                                onChange={e => onChangeModel(model.internalId, 'minP', e.target.checked ? 0 : undefined)}
                              />
                              <InputNumber max={1} min={0} step={0.1} precision={1} value={model.minP} onChange={e => onChangeModel(model.internalId, 'minP', e ?? 0)} onBlur={handleSave} /></>}
                          />
                          <FieldItem
                            title='Top K'
                            description='控制每一步考虑的候选 Token 数量。（Control the number of candidate Tokens considered at each step.）'
                            control={<>
                              <Checkbox checked={model.topK !== undefined}
                                onChange={e => onChangeModel(model.internalId, 'topK', e.target.checked ? 0 : undefined)}
                              />
                              <InputNumber max={1000} min={0} step={10} precision={0} value={model.topK} onChange={e => onChangeModel(model.internalId, 'topK', e ?? 0)} onBlur={handleSave} /></>}
                          />
                          <FieldItem
                            title='Top A'
                            description='Top P 的替代方案，控制响应的多样性（0 到 1）。（An alternative to Top P that controls response diversity (0 to 1)。）'
                            control={<>
                              <Checkbox checked={model.topA !== undefined}
                                onChange={e => onChangeModel(model.internalId, 'topA', e.target.checked ? 0 : undefined)}
                              />
                              <InputNumber max={1} min={0} step={0.1} precision={1} value={model.topA} onChange={e => onChangeModel(model.internalId, 'topA', e ?? 0)} onBlur={handleSave} /></>}
                          />
                          <FieldItem
                            title='Rep. Penalty'
                            description='减少重复。0 表示不惩罚，较高值可能影响连贯性。（Reduce repetition. 0 means no penalty, higher values may affect coherence.）'
                            control={<>
                              <Checkbox checked={model.repetitionPenalty !== undefined}
                                onChange={e => onChangeModel(model.internalId, 'repetitionPenalty', e.target.checked ? 0 : undefined)}
                              />
                              <InputNumber max={2} min={0} step={0.1} precision={1} value={model.repetitionPenalty} onChange={e => onChangeModel(model.internalId, 'repetitionPenalty', e ?? 0)} onBlur={handleSave} /></>}
                          />
                          <FieldItem
                            title='Truncate'
                            description='OpenRouter 专用：当输入过长时进行截断。（OpenRouter exclusive: truncate when input is too long.）'
                            control={
                              <Checkbox checked={model.truncate}
                                onChange={e => onChangeModel(model.internalId, 'truncate', e.target.checked)}
                              >{model.truncate ? '启用（Enable）' : '禁用（Disable）'}</Checkbox>
                            }
                          />
                          <FieldItem
                            title='Streaming'
                            description='为该模型启用流式响应。（Enable streaming response for this model.）'
                            control={
                              <Checkbox checked={model.streaming}
                                onChange={e => onChangeModel(model.internalId, 'streaming', e.target.checked)}
                              >{model.streaming ? '启用（Enable）' : '禁用（Disable）'}</Checkbox>
                            }
                          />
                          <FieldItem
                            title='System msg'
                            description='为该模型启用系统消息支持。（Enable system message support for this model.）'
                            control={
                              <Checkbox checked={model.systemAsUser}
                                onChange={e => onChangeModel(model.internalId, 'systemAsUser', e.target.checked)}
                              >{model.systemAsUser ? '启用（Enable）' : '禁用（Disable）'}</Checkbox>
                            }
                          />
                        </div>
                        <fieldset className='flex-1'>
                          <legend className='font-medium mb-2 whitespace-nowrap '>分组名称（Group Name）</legend>
                          <p className="text-xs text-secondary mb-2"> 可选，用于更好地组织。留空则不分组。 </p>
                          <Input value={model.group} onChange={e => onChangeModel(model.internalId, 'group', e.target.value)} onBlur={handleSave} />
                        </fieldset>
                        <fieldset className='flex-1'>
                          <legend className='font-medium mb-2 whitespace-nowrap '>提供商路由（Provider Routing）</legend>
                          <p className="text-xs text-secondary mb-2"> 仅 OpenRouter：留空使用自动路由；多个提供商用逗号分隔。 </p>
                          <Input value={mapOrRouting[model.internalId]} onChange={e => {
                            setMapOrRouting({ ...mapOrRouting, [model.internalId]: e.target.value })
                            onChangeModel(model.internalId, 'orRouting',
                              e.target.value.split(/,|，/).map(item => item.trim()).filter(s => s))
                          }} onBlur={(e) => {
                            setMapOrRouting({ ...mapOrRouting, [model.internalId]: e.target.value.split(/,|，/).map(item => item.trim()).filter(s => s).join(', ') })
                            handleSave()
                          }} />
                        </fieldset>
                      </div>
                    </details>
                  </div>
                </CollapseCard>
              </li>
            )}
          </ul>
          <div className='grow flex gap-2 py-1 flex-col'></div>
          <div className='mt-3 first:mt-0 flex gap-2'>
            <Button onClick={onAddModel}><PlusOutlined />添加模型（Add Model）</Button>
            <Button><ClipboardPasteIcon size={14} />从粘贴板导入（Import from Clipboard）</Button>
          </div>
        </div>

      </div>
    </div>
  </div>;
};



export default ModelsDetail;