import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MembershipLevel } from './membershipStore'

// 团队成员角色枚举
export enum TeamMemberRole {
  OWNER = 'owner',      // 拥有者
  ADMIN = 'admin',      // 管理员
  MEMBER = 'member',    // 普通成员
  VIEWER = 'viewer'     // 只读成员
}

// 团队成员接口
export interface TeamMember {
  id: string
  userId: string
  name: string
  email: string
  role: TeamMemberRole
  joinedAt: Date
  lastActiveAt?: Date
}

// 团队项目权限接口
export interface ProjectPermission {
  projectId: string
  canEdit: boolean
  canDelete: boolean
  canShare: boolean
  canExport: boolean
}

// 团队项目接口
export interface TeamProject {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  ownerId: string
  permissions: ProjectPermission[]
}

// 团队协作记录接口
export interface CollaborationRecord {
  id: string
  projectId: string
  userId: string
  action: string // 'create', 'update', 'delete', 'comment'
  content: string
  timestamp: Date
}

// 团队状态接口
export interface TeamState {
  teams: TeamProject[]
  members: TeamMember[]
  collaborations: CollaborationRecord[]
  currentTeamId: string | null
  currentProjectId: string | null
}

// 团队操作接口
export interface TeamActions {
  // 团队管理
  createTeam: (name: string, description?: string) => TeamProject
  updateTeam: (teamId: string, updates: Partial<TeamProject>) => void
  deleteTeam: (teamId: string) => void
  setCurrentTeam: (teamId: string | null) => void
  
  // 成员管理
  addMember: (teamId: string, member: Omit<TeamMember, 'id' | 'joinedAt'>) => TeamMember
  removeMember: (teamId: string, memberId: string) => void
  updateMemberRole: (teamId: string, memberId: string, role: TeamMemberRole) => void
  setCurrentProject: (projectId: string | null) => void
  
  // 项目管理
  createProject: (teamId: string, name: string, description?: string) => TeamProject
  updateProject: (projectId: string, updates: Partial<TeamProject>) => void
  deleteProject: (projectId: string) => void
  
  // 协作记录
  addCollaborationRecord: (record: Omit<CollaborationRecord, 'id' | 'timestamp'>) => CollaborationRecord
  getProjectCollaborations: (projectId: string) => CollaborationRecord[]
  getUserCollaborations: (userId: string) => CollaborationRecord[]
  
  // 权限检查
  hasPermission: (userId: string, projectId: string, action: keyof ProjectPermission) => boolean
  isTeamOwner: (userId: string, teamId: string) => boolean
  isTeamAdmin: (userId: string, teamId: string) => boolean
}

// 初始状态
const initialState: TeamState = {
  teams: [],
  members: [],
  collaborations: [],
  currentTeamId: null,
  currentProjectId: null
}

export const useTeamStore = create<TeamState & TeamActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // 团队管理
      createTeam: (name, description) => {
        const newTeam: TeamProject = {
          id: `team_${Date.now()}`,
          name,
          description,
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: 'user_31DJe07dLKK0ZwPoepTqzDPvQ39', // 默认用户ID，实际应从用户状态获取
          permissions: []
        }
        
        set((state) => ({
          teams: [...state.teams, newTeam]
        }))
        
        return newTeam
      },
      
      updateTeam: (teamId, updates) => {
        set((state) => ({
          teams: state.teams.map(team => 
            team.id === teamId 
              ? { ...team, ...updates, updatedAt: new Date() } 
              : team
          )
        }))
      },
      
      deleteTeam: (teamId) => {
        set((state) => ({
          teams: state.teams.filter(team => team.id !== teamId),
          members: state.members.filter(member => member.id !== teamId),
          collaborations: state.collaborations.filter(record => record.projectId !== teamId)
        }))
      },
      
      setCurrentTeam: (teamId) => set({ currentTeamId: teamId }),
      
      // 成员管理
      addMember: (teamId, memberData) => {
        const newMember: TeamMember = {
          id: `member_${Date.now()}`,
          ...memberData,
          joinedAt: new Date()
        }
        
        set((state) => ({
          members: [...state.members, newMember]
        }))
        
        return newMember
      },
      
      removeMember: (teamId, memberId) => {
        set((state) => ({
          members: state.members.filter(member => member.id !== memberId)
        }))
      },
      
      updateMemberRole: (teamId, memberId, role) => {
        set((state) => ({
          members: state.members.map(member => 
            member.id === memberId 
              ? { ...member, role } 
              : member
          )
        }))
      },
      
      setCurrentProject: (projectId) => set({ currentProjectId: projectId }),
      
      // 项目管理
      createProject: (teamId, name, description) => {
        const newProject: TeamProject = {
          id: `project_${Date.now()}`,
          name,
          description,
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: 'user_31DJe07dLKK0ZwPoepTqzDPvQ39', // 默认用户ID
          permissions: []
        }
        
        set((state) => ({
          teams: state.teams.map(team => 
            team.id === teamId 
              ? { ...team, updatedAt: new Date() } 
              : team
          )
        }))
        
        return newProject
      },
      
      updateProject: (projectId, updates) => {
        set((state) => ({
          teams: state.teams.map(team => 
            team.id === projectId 
              ? { ...team, ...updates, updatedAt: new Date() } 
              : team
          )
        }))
      },
      
      deleteProject: (projectId) => {
        set((state) => ({
          teams: state.teams.filter(team => team.id !== projectId),
          collaborations: state.collaborations.filter(record => record.projectId !== projectId)
        }))
      },
      
      // 协作记录
      addCollaborationRecord: (recordData) => {
        const newRecord: CollaborationRecord = {
          id: `collab_${Date.now()}`,
          ...recordData,
          timestamp: new Date()
        }
        
        set((state) => ({
          collaborations: [...state.collaborations, newRecord]
        }))
        
        return newRecord
      },
      
      getProjectCollaborations: (projectId) => {
        return get().collaborations.filter(record => record.projectId === projectId)
      },
      
      getUserCollaborations: (userId) => {
        return get().collaborations.filter(record => record.userId === userId)
      },
      
      // 权限检查
      hasPermission: (userId, projectId, action) => {
        const state = get()
        const project = state.teams.find(p => p.id === projectId)
        if (!project) return false
        
        // 项目拥有者拥有所有权限
        if (project.ownerId === userId) return true
        
        // 查找用户在该项目中的权限
        const permission = project.permissions.find(p => 
          state.members.find(m => m.userId === userId)?.id === p.projectId
        )
        
        return permission ? (permission[action] as boolean) : false
      },
      
      isTeamOwner: (userId, teamId) => {
        const state = get()
        const team = state.teams.find(t => t.id === teamId)
        return team ? team.ownerId === userId : false
      },
      
      isTeamAdmin: (userId, teamId) => {
        const state = get()
        const team = state.teams.find(t => t.id === teamId)
        if (!team) return false
        
        // 拥有者也是管理员
        if (team.ownerId === userId) return true
        
        // 查找成员角色
        const member = state.members.find(m => m.userId === userId)
        return member ? member.role === TeamMemberRole.ADMIN : false
      }
    }),
    {
      name: 'team-storage',
      partialize: (state) => ({ 
        teams: state.teams,
        members: state.members,
        collaborations: state.collaborations,
        currentTeamId: state.currentTeamId,
        currentProjectId: state.currentProjectId
      }),
    }
  )
)