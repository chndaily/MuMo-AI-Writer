import classNames from "classnames";
import { twMerge } from "tailwind-merge";
export { generateUUID } from "./uuid";

export function cn(...inputs: classNames.ArgumentArray) {
  return twMerge(classNames(inputs));
}

/**
 * 复制文字
 * @param {string} text  要复制的文本
 * @returns {boolean} true/false
 */
export const copyText = async (text: string) => {
  if (window.navigator?.clipboard) {
    window.navigator.clipboard.writeText(text)
    return true
  }
  // 动态创建 textarea 标签
  const textarea = document.createElement('textarea')
  // 将该 textarea 设为 readonly 防止 iOS 下自动唤起键盘，同时将 textarea 移出可视区域
  textarea.readOnly = true
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  textarea.style.opacity = '0'
  // 将要 copy 的值赋给 textarea 标签的 value 属性
  textarea.value = text
  // 将 textarea 插入到 body 中
  document.body.appendChild(textarea)
  // 选中值并复制
  textarea.select()
  const result = document.execCommand('Copy')
  document.body.removeChild(textarea)
  return result
}

