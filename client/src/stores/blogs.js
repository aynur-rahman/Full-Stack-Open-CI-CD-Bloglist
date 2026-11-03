import { create } from 'zustand'
import blogService from '../services/blogs'
import { useUserStore } from './user'
export const useBlogStore = create((set, get) => ({
  blogs: [],
  loading: false,
  ready: false,
  error: null,
  pending: [],
  creating: false,
  initialize: async () => {
    if (get().loading) return
    set({ loading: true, error: null })
    try {
      const blogs = await blogService.getAll()
      set({ blogs, ready: true })
    } catch {
      set({ error: 'Could not load blogs. Please try again.' })
    } finally {
      set({ loading: false })
    }
  },
  create: async (values) => {
    if (get().creating || get().loading || !get().ready) return false
    set({ creating: true })
    try {
      const created = await blogService.create(
        values,
        useUserStore.getState().user?.token,
      )
      set((state) => ({ blogs: [...state.blogs, created] }))
      return created
    } finally {
      set({ creating: false })
    }
  },
  like: async (id) => {
    if (get().pending.includes(id)) return
    const blog = get().blogs.find((item) => item.id === id)
    if (!blog) return
    set((state) => ({ pending: [...state.pending, id] }))
    try {
      const updated = await blogService.like(
        blog,
        useUserStore.getState().user?.token,
      )
      set((state) => ({
        blogs: state.blogs.map((item) => (item.id === id ? updated : item)),
      }))
    } finally {
      set((state) => ({ pending: state.pending.filter((item) => item !== id) }))
    }
  },
  remove: async (id) => {
    if (get().pending.includes(id)) return false
    set((state) => ({ pending: [...state.pending, id] }))
    try {
      await blogService.remove(id, useUserStore.getState().user?.token)
      set((state) => ({ blogs: state.blogs.filter((item) => item.id !== id) }))
      return true
    } finally {
      set((state) => ({ pending: state.pending.filter((item) => item !== id) }))
    }
  },
  comment: async (id, content) => {
    if (get().pending.includes(id)) return false
    set((state) => ({ pending: [...state.pending, id] }))
    try {
      const updated = await blogService.comment(id, content)
      set((state) => ({
        blogs: state.blogs.map((item) => (item.id === id ? updated : item)),
      }))
      return true
    } finally {
      set((state) => ({ pending: state.pending.filter((item) => item !== id) }))
    }
  },
}))
