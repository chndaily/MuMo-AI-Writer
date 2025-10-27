import React, { useContext, useLayoutEffect } from 'react';
import { StyleProvider } from '@ant-design/cssinjs';
import { App, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useThemeToken } from '../hooks';


/**
 * 增强版：支持-、_、空格分隔转小驼峰
 * @param {string} str - 输入字符串（如"hello_world"或"hello world"）
 * @returns {string} 驼峰字符串
 */
function toCamelCase(str: string) {
  // 1. 用正则匹配所有非单词字符（-、_、空格）后的字符
  // 正则解释：/[\-_ ](\w)/g → 匹配"_", "-", 空格和后面的一个单词字符
  return str.replace(/[\-_ ](\w)/g, (_, char) => {
    // 2. 将捕获的字符转为大写，并去掉分隔符
    return char.toUpperCase();
  });
}

/**
 * 大驼峰版：转换为帕斯卡命名法
 * @param {string} str - 输入字符串（如"hello-world"）
 * @returns {string} 大驼峰字符串（如"HelloWorld"）
 */
function toPascalCase(str: string) {
  // 1. 先转小驼峰（如"helloWorld"）
  const camelCase = toCamelCase(str);
  // 2. 首字母大写（如"h"→"H"）
  return camelCase[0].toUpperCase() + camelCase.slice(1);
}


export default function StaticProvider({ children }: { children: React.ReactNode }) {
  const { locale, theme } = useContext(ConfigProvider.ConfigContext);
  const token = useThemeToken();
  useLayoutEffect(() => {
    ConfigProvider.config({
      holderRender: (children) => (
        <StyleProvider hashPriority="high">
          <ConfigProvider locale={zhCN} theme={theme}>
            <App
              message={{
                maxCount: 1,
              }}
              notification={{
                maxCount: 1,
              }}
            >
              {children}
            </App>
          </ConfigProvider>
        </StyleProvider>
      ),
    });
  }, [locale, theme]);

  useLayoutEffect(() => {
    document.querySelectorAll('#antd-theme').forEach(style => {
      style.remove();
    });
    const style = document.createElement('style');
    style.id = 'antd-theme';
    console.log(token);
    style.innerHTML = `
      :root {
        --ant-color-primary: ${token.colorPrimary};
        --ant-color-primary-bg: ${token.colorPrimaryBg};
        --ant-color-primary-hover: ${token.colorPrimaryHover};
        --ant-color-primary-active: ${token.colorPrimaryActive};
        --ant-color-border: ${token.colorBorder};
        --ant-color-text: ${token.colorText};
        --ant-color-text-base: ${token.colorTextBase};
        --ant-color-text-secondary: ${token.colorTextSecondary};
        --ant-color-text-tertiary: ${token.colorTextTertiary};
        --ant-color-text-quaternary: ${token.colorTextQuaternary};
        --ant-color-bg-container: ${token.colorBgContainer};
        --ant-collapse-header-bg: ${token.colorFillTertiary};
        --ant-color-success: ${token.colorSuccess};
        --ant-color-warning: ${token.colorWarning};
        --ant-color-error: ${token.colorError};
        --ant-color-info: ${token.colorInfo};
        --ant-color-bg-layout: ${token.colorBgLayout};
        --ant-color-bg-container: ${token.colorBgContainer};
        --ant-color-bg-elevated: ${token.colorBgElevated};
      }
    `;
    document.head.appendChild(style);
  }, [token]);
  return children
}