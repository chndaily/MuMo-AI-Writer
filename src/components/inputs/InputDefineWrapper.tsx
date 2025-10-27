import { Checkbox } from "antd"
import { ChevronDownIcon } from "lucide-react"

interface InputDefineWrapperProps {
  children: React.ReactNode
  title: string
  checked: boolean
  extra?: React.ReactNode
  onCheck: (checked: boolean) => void
}

const InputDefineWrapper: React.FC<InputDefineWrapperProps> = ({ children, title, checked, extra, onCheck }) => {
  return <details className="block border-1 p-0.5 rounded-sm">
    <summary className="cursor-pointer rounded-sm px-1.5 py-1 flex items-center justify-between hover:bg-primary-bg">
      <div>
        <Checkbox checked={checked} onChange={(e) => onCheck(e.target.checked)} />
        <span className="ml-2 font-medium">{title}</span>
      </div>
      {extra}
      <ChevronDownIcon size={20} />
    </summary>
    <div className="pl-8 pr-2">
      {children}
    </div>
  </details>
}

export default InputDefineWrapper