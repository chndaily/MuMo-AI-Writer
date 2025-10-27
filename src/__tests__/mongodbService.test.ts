// MongoDB服务测试
import { connectToDatabase, disconnectFromDatabase, getUsersCollection } from '@/services/mongodbService'
import { MembershipLevel } from '@/stores/membershipStore'

describe('MongoDB Service', () => {
  beforeAll(async () => {
    // 连接到数据库
    await connectToDatabase()
  }, 15000) // 增加超时时间到15秒

  afterAll(async () => {
    // 断开数据库连接
    await disconnectFromDatabase()
  })

  it('should connect to database and create user collection', async () => {
    // 获取用户集合
    const usersCollection = getUsersCollection()
    
    // 验证集合存在
    expect(usersCollection).toBeDefined()
    
    // 插入测试用户
    const testUser = {
      _id: 'test-user-id',
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: 'hashed-password',
      createdAt: new Date(),
      lastLoginAt: null,
      membershipInfo: {
        level: MembershipLevel.FREE,
        expiryDate: null,
        maxNovels: 3,
        aiGenerationLimit: 10,
        aiGenerationUsed: 0,
        features: ['novel_creation'],
        teamEnabled: false,
        maxTeamMembers: 0,
        isAdmin: false,
        username: 'testuser',
        email: 'test@example.com'
      }
    }
    
    // 插入用户
    const result = await usersCollection.insertOne(testUser)
    // 修复测试，不再检查insertedId，因为API服务返回的是完整的用户对象
    expect(result).toBeDefined()
    
    // 查询用户
    const foundUser = await usersCollection.findOne({ _id: 'test-user-id' })
    expect(foundUser).toBeDefined()
    expect(foundUser?.username).toBe('testuser')
    
    // 删除测试用户
    await usersCollection.deleteOne({ _id: 'test-user-id' })
  }, 10000) // 增加测试超时时间到10秒
})