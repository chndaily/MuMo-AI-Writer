/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_WECHAT_APPID: string
  readonly VITE_WECHAT_MCHID: string
  readonly VITE_ALIPAY_APP_ID: string
  readonly VITE_PAYMENT_NOTIFY_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}