import { create } from 'zustand'
import { getUser, saveUser, removeUser } from '../services/persistentUser'
import loginService from '../services/login'
export const useUserStore = create((set) => ({
  user: getUser(),
  login: async (credentials) => {
    const user = await loginService.login(credentials)
    saveUser(user)
    set({ user })
  },
  logout: () => {
    removeUser()
    set({ user: null })
  },
}))
