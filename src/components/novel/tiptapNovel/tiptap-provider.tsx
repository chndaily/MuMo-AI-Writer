// Provider wrapper
import { useRef, createContext, useContext } from 'react'
import { AiTaskStatus, AiTaskInfo } from "./type";
import { createStore, useStore } from 'zustand'
interface TiptapProps {
  tasks: AiTaskInfo[]
}

interface TiptapState extends TiptapProps {
  addAiTask: (task: AiTaskInfo) => void
  removeAiTask: (id: string) => void
  updateAiTask: (task: AiTaskInfo) => void
  getAiTask: (id: string) => AiTaskInfo | undefined
  getAiTasks: () => AiTaskInfo[]
  updateAiTaskStatus: (id: string, status: AiTaskStatus) => void
}

const createTiptapStore = (initProps?: Partial<TiptapProps>) => {
  const DEFAULT_PROPS: TiptapProps = {
    tasks: [],
  }
  return createStore<TiptapState>()((set, get) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    addAiTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
    removeAiTask: (id) => set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) })),
    updateAiTask: (task) => set((state) => ({ tasks: state.tasks.map((t) => t.id === task.id ? task : t) })),
    getAiTask: (id) => get().tasks.find((task) => task.id === id),
    getAiTasks: () => get().tasks,
    updateAiTaskStatus: (id, status) => set((state) => ({ tasks: state.tasks.map((t) => t.id === id ? { ...t, status } : t) })),
  }))
}

type TiptapStore = ReturnType<typeof createTiptapStore>


export const TiptapContext = createContext<TiptapStore | null>(null)

// 转成不是必传的props
type TiptapProviderProps = React.PropsWithChildren<Partial<TiptapProps>>

function TiptapProvider({ children, ...props }: TiptapProviderProps) {
  const storeRef = useRef<TiptapStore>()
  if (!storeRef.current) {
    storeRef.current = createTiptapStore(props)
    console.log(storeRef.current)
  }
  return (
    <TiptapContext.Provider value={storeRef.current}>
      {children}
    </TiptapContext.Provider>
  )
}

function useTiptapContext<T>(selector: (state: TiptapState) => T): T {
  const store = useContext(TiptapContext)

  if (!store) throw new Error('Missing TiptapContext.Provider in the tree')
  return useStore(store, selector)
}
export { useTiptapContext }
export default TiptapProvider;