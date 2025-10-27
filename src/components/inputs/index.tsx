import { InputType, InputSettings, PromptInputSchema } from '#/promptInput'
import { TextDefineView, TextView } from './Text'
import { DropdownDefine, DropdownView } from './Dropdown'


interface PromptInputDefineProps {
  type: InputType
  onChange: (values: PromptInputSchema) => void,
  inputOption: PromptInputSchema
}

export const PromptInputDefine: React.FC<PromptInputDefineProps> = (props) => {
  if (props.type === 'text') {
    return <TextDefineView onChange={props.onChange} inputOption={props.inputOption} />
  }
  if (props.type === 'dropdown') {
    return <DropdownDefine onChange={props.onChange} inputOption={props.inputOption} />
  }
}

interface PromptInputViewProps {
  type: InputType
  value: string
  onChange: (value: string) => void,
  inputOption: PromptInputSchema
}

export const PromptInputView: React.FC<PromptInputViewProps> = (props) => {
  if (props.type === 'text') {
    return <TextView value={props.value} onChange={props.onChange} inputOption={props.inputOption} />
  }
  if (props.type === 'dropdown') {
    return <DropdownView value={props.value} onChange={props.onChange} inputOption={props.inputOption} />
  }
  return null
}