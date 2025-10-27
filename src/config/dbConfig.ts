// 数据库配置
export const dbConfig = {
  // MongoDB连接字符串
  // 在生产环境中，应该从环境变量中读取
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mumo-ai-writer',
  
  // 数据库名称
  dbName: process.env.MONGODB_DB_NAME || 'mumo-ai-writer',
  
  // 用户集合名称
  userCollection: 'users',
  
  // 连接选项
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
}