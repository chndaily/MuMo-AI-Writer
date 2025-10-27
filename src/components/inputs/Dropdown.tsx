// 文本输入定义组件
import { Button, Dropdown, Input } from "antd"
import { useMemo } from "react"
import { clone } from "ramda"
import { PromptInputSchema, DropdownDefine as DropdownDefineType } from "#/promptInput"
import InputDefineWrapper from "./InputDefineWrapper"
import { HolderOutlined } from "@ant-design/icons"
import { MessageSquareTextIcon, PaletteIcon, Trash2Icon } from "lucide-react"

type DropdownDefineProps = {
  onChange: (values: PromptInputSchema) => void
  inputOption: PromptInputSchema
}


const DropdownDefine: React.FC<DropdownDefineProps> = ({ inputOption, onChange }) => {
  const setting = useMemo(() => {
    return inputOption.settings?.dropdown || { options: [] } as DropdownDefineType
  }, [inputOption])

  const onCheck = (checked: boolean) => {
    onChange({ ...inputOption, types: checked ? [...inputOption.types, 'dropdown'] : inputOption.types.filter(type => type !== 'dropdown') })
  }

  const onSettingChange = (option: DropdownDefineType['options'][number]) => {
    const settings = clone(inputOption.settings) || {}
    if (!settings.dropdown) settings.dropdown = { options: [] }
    settings.dropdown.options = settings.dropdown.options.map(item => item.id === option.id ? option : item)
    onChange({ ...inputOption, settings })
  }



  return <InputDefineWrapper title="Dropdown" checked={inputOption.types.includes('dropdown')} onCheck={onCheck}>
    <>
      <fieldset className="pb-2 pt-1">
        <legend className="font-medium">Dropdown Options</legend>
        <p className="text-secondary text-sm"> Define the options for the select menu / dropdown. </p>
      </fieldset>
      <ul className="flex flex-col gap-1.5">
        {setting.options?.map((option, index) => (
          <li key={option.id} className='flex items-center gap-2'>
            <Button className='w-6 mt-[3px] text-lg' type='text' icon={<HolderOutlined />} />
            <Input value={option.label} onChange={(e) => onSettingChange({ ...option, label: e.target.value })} />
            <div className="flex items-center gap-3">
              <Button type='text' icon={<MessageSquareTextIcon size={18} />} />
              <Dropdown
                placement='topLeft'
                trigger={['click']}
                menu={{
                  items: [
                    { key: '1', label: '123' },
                  ],
                }}
              >
                <Button type='text' icon={<PaletteIcon size={18} />} />
              </Dropdown>
              <Button type='text' icon={<Trash2Icon size={18} />} />
            </div>
          </li>
        ))}
      </ul>
    </>
  </InputDefineWrapper>
}

interface DropdownProps {
  value: string
  onChange: (value: string) => void
  inputOption: PromptInputSchema
}

const DropdownView: React.FC<DropdownProps> = ({ value, onChange, inputOption }) => {
  return <Input value={value} onChange={(e) => onChange(e.target.value)} />
}

export { DropdownDefine, DropdownView }