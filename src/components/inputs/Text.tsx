// 文本输入定义组件
import { Checkbox, Input } from "antd"
import { PromptInputSchema, TextDefine as TextDefineType } from "#/promptInput"
import { useMemo } from "react"
import { ChevronDownIcon } from "lucide-react"
import InputDefineWrapper from "./InputDefineWrapper"
import { clone } from "ramda"



type TextDefineProps = {
  onChange: (values: PromptInputSchema) => void
  inputOption: PromptInputSchema
}


const TextDefineView: React.FC<TextDefineProps> = ({ inputOption, onChange }) => {
  const setting = useMemo(() => {
    return inputOption.settings?.text || {}
  }, [inputOption])
  const onCheck = (checked: boolean) => {
    onChange({ ...inputOption, types: checked ? [...inputOption.types, 'text'] : inputOption.types.filter(type => type !== 'text') })
  }

  const onSettingChange = <T extends keyof TextDefineType>(key: T, value: TextDefineType[T]) => {
    const settings = clone(inputOption.settings) || {}
    settings.text = { ...(settings.text || {}), [key]: value }
    onChange({ ...inputOption, settings })
  }
  return <InputDefineWrapper title="Text" checked={inputOption.types.includes('text')} onCheck={onCheck}>
    <>
      <fieldset className="pb-2 pt-1">
        <legend className="font-medium">Placeholder</legend>
        <p className="text-secondary text-sm">The placeholder text to display in the input field.</p>
        <Input className="mt-1" value={setting.placeholder} onChange={(e) => onSettingChange('placeholder', e.target.value)} />
      </fieldset>
      <div className="flex items-start gap-2 my-2">
        <Checkbox checked={setting.richText} onChange={(e) => onSettingChange('richText', e.target.checked)} />
        <div>
          <span className="font-medium"> Allow Formatted Text </span>
          <p className="text-secondary text-sm"> Allow this input to use formatted text in a larger text area. Useful for longer additional instructions. </p>
        </div>
      </div>
    </>
  </InputDefineWrapper>
}

interface TextProps {
  value: string
  onChange: (value: string) => void
  inputOption: PromptInputSchema
}

const TextView: React.FC<TextProps> = ({ value, onChange, inputOption }) => {
  return <Input value={value} onChange={(e) => onChange(e.target.value)} />
}

export { TextDefineView, TextView }