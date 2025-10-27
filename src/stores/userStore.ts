import { create } from 'zustand'

interface UserInfo {
  id: string
  name: string
  email: string
  avatar: string
}

interface UserState {
  userInfo: UserInfo | null
}

interface UserActions {
  setUserInfo: (userInfo: UserInfo) => void
}

export const useUserStore = create<UserState & UserActions>()(
  (set) => ({
    userInfo: null,
    setUserInfo: (userInfo) => set({ userInfo })
  })
)

export const useUserInfoId = () => {
  const { userInfo } = useUserStore()
  return userInfo?.id || 'user_31DJe07dLKK0ZwPoepTqzDPvQ39'
}
