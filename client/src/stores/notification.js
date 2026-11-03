import { create } from 'zustand'
let timer
export const useNotificationStore = create((set) => ({
  notification: null,
  notify: (message, type = 'success') => {
    clearTimeout(timer)
    set({ notification: { message, type } })
    timer = setTimeout(() => set({ notification: null }), 5000)
  },
  clear: () => {
    clearTimeout(timer)
    set({ notification: null })
  },
}))
