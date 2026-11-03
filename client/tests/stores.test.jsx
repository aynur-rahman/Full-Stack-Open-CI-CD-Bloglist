import { beforeEach, afterEach, expect, test, vi } from 'vitest'
import { useBlogStore } from '../src/stores/blogs'
import { useUserStore } from '../src/stores/user'
import { useNotificationStore } from '../src/stores/notification'
import blogService from '../src/services/blogs'
import loginService from '../src/services/login'
import { getUser, saveUser, removeUser } from '../src/services/persistentUser'
vi.mock('../src/services/blogs')
vi.mock('../src/services/login')
const blog = {
  id: 'one',
  title: 'A blog',
  author: 'Writer',
  url: 'https://example.com',
  likes: 2,
  comments: [],
  user: { id: 'user', username: 'writer', name: 'Writer' },
}
beforeEach(() => {
  vi.resetAllMocks()
  window.localStorage.clear()
  useBlogStore.setState({
    blogs: [blog],
    loading: false,
    ready: true,
    error: null,
    pending: [],
    creating: false,
  })
  useUserStore.setState({ user: { username: 'writer', token: 'test-token' } })
})
afterEach(() => {
  useNotificationStore.getState().clear()
  vi.useRealTimers()
})
test('initialization stores backend data and failed loading remains visible', async () => {
  blogService.getAll.mockResolvedValue([blog])
  await useBlogStore.getState().initialize()
  expect(useBlogStore.getState().blogs).toEqual([blog])
  blogService.getAll.mockRejectedValue(new Error('offline'))
  await useBlogStore.getState().initialize()
  expect(useBlogStore.getState().error).toMatch(/Could not load/)
  expect(useBlogStore.getState().blogs).toEqual([blog])
})
test('a like uses current store values, preserves returned comments and releases duplicate guard', async () => {
  let resolve
  blogService.like.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  const first = useBlogStore.getState().like(blog.id)
  await useBlogStore.getState().like(blog.id)
  expect(blogService.like).toHaveBeenCalledExactlyOnceWith(blog, 'test-token')
  resolve({ ...blog, likes: 3, comments: ['Stored comment'] })
  await first
  expect(useBlogStore.getState().blogs[0]).toMatchObject({
    likes: 3,
    comments: ['Stored comment'],
  })
  expect(blog.likes).toBe(2)
  expect(useBlogStore.getState().pending).toEqual([])
})
test('failed liking and deletion leave state unchanged and release pending ids', async () => {
  blogService.like.mockRejectedValue(new Error('offline'))
  blogService.remove.mockRejectedValue(new Error('offline'))
  await expect(useBlogStore.getState().like(blog.id)).rejects.toThrow('offline')
  await expect(useBlogStore.getState().remove(blog.id)).rejects.toThrow(
    'offline',
  )
  expect(useBlogStore.getState().blogs).toEqual([blog])
  expect(useBlogStore.getState().pending).toEqual([])
})
test('creation waits for initialized data and stores only server-confirmed additions', async () => {
  useBlogStore.setState({ ready: false })
  expect(await useBlogStore.getState().create({ title: 'New' })).toBe(false)
  expect(blogService.create).not.toHaveBeenCalled()
  useBlogStore.setState({ ready: true })
  blogService.create.mockResolvedValue({ ...blog, id: 'two' })
  await useBlogStore.getState().create({ title: 'New' })
  expect(useBlogStore.getState().blogs.map((item) => item.id)).toEqual([
    'one',
    'two',
  ])
})
test('anonymous comments use the returned server record; failed comments do not change it', async () => {
  useUserStore.setState({ user: null })
  blogService.comment.mockResolvedValue({ ...blog, comments: ['A comment'] })
  expect(await useBlogStore.getState().comment(blog.id, 'A comment')).toBe(true)
  expect(blogService.comment).toHaveBeenCalledExactlyOnceWith(
    blog.id,
    'A comment',
  )
  blogService.comment.mockRejectedValue(new Error('offline'))
  await expect(
    useBlogStore.getState().comment(blog.id, 'Lost'),
  ).rejects.toThrow('offline')
  expect(useBlogStore.getState().blogs[0].comments).toEqual(['A comment'])
})
test('login and logout persist only through the dedicated service', async () => {
  const user = { username: 'writer', token: 'valid-token', name: 'Writer' }
  loginService.login.mockResolvedValue(user)
  await useUserStore
    .getState()
    .login({ username: 'writer', password: 'example' })
  expect(getUser()).toEqual(user)
  expect(useUserStore.getState().user).toEqual(user)
  useUserStore.getState().logout()
  expect(getUser()).toBeNull()
  expect(useUserStore.getState().user).toBeNull()
})
test('persistent service rejects malformed storage and supports explicit save/remove', () => {
  window.localStorage.setItem('loggedExtensionBloglistUser', '{bad')
  expect(getUser()).toBeNull()
  saveUser({ username: 'writer' })
  expect(getUser()).toBeNull()
  saveUser({ username: 'writer', token: 'token' })
  expect(getUser().token).toBe('token')
  removeUser()
  expect(getUser()).toBeNull()
})
test('a replacement notification lasts five seconds from the replacement', () => {
  vi.useFakeTimers()
  useNotificationStore.getState().notify('first')
  vi.advanceTimersByTime(4000)
  useNotificationStore.getState().notify('second', 'error')
  vi.advanceTimersByTime(1000)
  expect(useNotificationStore.getState().notification).toEqual({
    message: 'second',
    type: 'error',
  })
  vi.advanceTimersByTime(4000)
  expect(useNotificationStore.getState().notification).toBeNull()
})
