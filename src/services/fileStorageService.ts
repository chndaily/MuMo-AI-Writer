// 文件存储服务
import { message } from 'antd'

// 文件信息接口
export interface FileInfo {
  id: string
  name: string
  type: string
  size: number
  url: string
  encrypted: boolean
  createdAt: Date
}

// 简单的加密函数（在实际应用中应该使用更安全的加密算法）
const encryptData = (data: string, key: string): string => {
  // 这里使用简单的异或加密作为示例
  // 在实际应用中，应该使用 AES 等安全加密算法
  let result = ''
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return btoa(result) // Base64 编码
}

// 简单的解密函数
const decryptData = (data: string, key: string): string => {
  // Base64 解码
  const decoded = atob(data)
  // 异或解密
  let result = ''
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return result
}

// 生成文件ID
const generateFileId = (): string => {
  return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// 保存文件到本地存储（模拟服务端存储）
export const saveFile = async (file: File, encrypt: boolean = true): Promise<FileInfo> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const fileData = e.target?.result as string
        const fileId = generateFileId()
        const encryptionKey = 'mumo_ai_writer_encryption_key' // 在实际应用中应该从环境变量获取
        
        // 如果需要加密，则加密文件数据
        const processedData = encrypt ? encryptData(fileData, encryptionKey) : fileData
        
        // 创建文件信息对象
        const fileInfo: FileInfo = {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          url: processedData,
          encrypted: encrypt,
          createdAt: new Date()
        }
        
        // 保存到本地存储（模拟服务端存储）
        const storedFiles = JSON.parse(localStorage.getItem('stored-files') || '[]')
        storedFiles.push(fileInfo)
        localStorage.setItem('stored-files', JSON.stringify(storedFiles))
        
        console.log('File saved:', fileInfo)
        resolve(fileInfo)
      } catch (error) {
        console.error('Failed to save file:', error)
        reject(new Error('文件保存失败'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    // 读取文件为 Data URL
    reader.readAsDataURL(file)
  })
}

// 获取文件信息
export const getFile = (fileId: string): FileInfo | null => {
  try {
    const storedFiles = JSON.parse(localStorage.getItem('stored-files') || '[]')
    const fileInfo = storedFiles.find((file: FileInfo) => file.id === fileId)
    
    if (fileInfo) {
      return fileInfo
    }
    
    return null
  } catch (error) {
    console.error('Failed to get file:', error)
    return null
  }
}

// 获取所有文件信息
export const getAllFiles = (): FileInfo[] => {
  try {
    const storedFiles = JSON.parse(localStorage.getItem('stored-files') || '[]')
    return storedFiles
  } catch (error) {
    console.error('Failed to get all files:', error)
    return []
  }
}

// 删除文件（在实际应用中可能需要管理员权限）
export const deleteFile = (fileId: string): boolean => {
  try {
    const storedFiles = JSON.parse(localStorage.getItem('stored-files') || '[]')
    const filteredFiles = storedFiles.filter((file: FileInfo) => file.id !== fileId)
    localStorage.setItem('stored-files', JSON.stringify(filteredFiles))
    return true
  } catch (error) {
    console.error('Failed to delete file:', error)
    return false
  }
}

// 解密文件数据
export const decryptFileData = (fileInfo: FileInfo): string => {
  if (!fileInfo.encrypted) {
    return fileInfo.url
  }
  
  const encryptionKey = 'mumo_ai_writer_encryption_key' // 在实际应用中应该从环境变量获取
  return decryptData(fileInfo.url, encryptionKey)
}

// 文件上传服务
export const uploadFile = async (file: File, options?: { encrypt?: boolean }): Promise<FileInfo> => {
  const encrypt = options?.encrypt !== false // 默认加密
  
  try {
    message.loading('文件上传中...', 0)
    
    // 保存文件
    const fileInfo = await saveFile(file, encrypt)
    
    message.destroy()
    message.success('文件上传成功')
    
    return fileInfo
  } catch (error) {
    message.destroy()
    message.error('文件上传失败')
    throw error
  }
}