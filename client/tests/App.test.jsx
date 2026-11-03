import { beforeEach, afterEach, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App'
import { useBlogStore } from '../src/stores/blogs'
import { useUserStore } from '../src/stores/user'
import { useNotificationStore } from '../src/stores/notification'
import blogService from '../src/services/blogs'
import usersService from '../src/services/users'
vi.mock('../src/services/blogs')
vi.mock('../src/services/users')
const blog = {
  id: 'one',
  title: 'A readable blog',
  author: 'Writer',
  url: 'https://example.com',
  likes: 2,
  comments: [],
  user: { id: 'user', username: 'writer', name: 'Writer' },
}
const show = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
beforeEach(() => {
  vi.resetAllMocks()
  useBlogStore.setState({
    blogs: [],
    loading: false,
    ready: false,
    error: null,
    pending: [],
    creating: false,
  })
  useUserStore.setState({ user: null })
  blogService.getAll.mockResolvedValue([blog])
})
afterEach(() => useNotificationStore.getState().clear())
test('an invalid creator reaches the boundary and navigation recovers the list', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  blogService.getAll.mockResolvedValue([{ ...blog, user: null }])
  show('/blogs/one')
  await screen.findByText('Something went wrong')
  await userEvent
    .setup()
    .click(screen.getByRole('link', { name: 'blogs', exact: true }))
  await screen.findByRole('link', { name: blog.title })
  expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
})
test('unknown route and missing blog have useful fallback views', async () => {
  show('/unknown/path')
  expect(screen.getByText('Page not found')).toBeVisible()
  expect(screen.getByRole('link', { name: 'users', exact: true })).toBeVisible()
  await waitFor(() => expect(useBlogStore.getState().ready).toBe(true))
})
test('a missing blog is not treated as a rendering failure', async () => {
  show('/blogs/missing')
  await screen.findByText('Blog not found')
  expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
})
test('anonymous comments appear after success and preserve text on failed retry', async () => {
  show('/blogs/one')
  await screen.findByRole('heading', { name: blog.title })
  const user = userEvent.setup()
  blogService.comment.mockResolvedValue({
    ...blog,
    comments: ['Anonymous thought'],
  })
  await user.type(screen.getByLabelText('Comment'), 'Anonymous thought')
  await user.click(screen.getByRole('button', { name: 'add comment' }))
  await screen.findByText('Anonymous thought')
  expect(screen.getByLabelText('Comment')).toHaveValue('')
  blogService.comment.mockRejectedValue(new Error('offline'))
  await user.type(screen.getByLabelText('Comment'), 'Keep this')
  await user.click(screen.getByRole('button', { name: 'add comment' }))
  await screen.findByRole('alert')
  expect(screen.getByLabelText('Comment')).toHaveValue('Keep this')
})
test('expired session on a mutation logs out and reports the failure', async () => {
  useUserStore.setState({ user: { username: 'writer', token: 'old-token' } })
  blogService.like.mockRejectedValue({ response: { status: 401 } })
  show('/blogs/one')
  await screen.findByRole('heading', { name: blog.title })
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Like', exact: true }))
  await screen.findByText(/session has expired/)
  expect(useUserStore.getState().user).toBeNull()
  expect(screen.getByRole('link', { name: 'login', exact: true })).toBeVisible()
})
test('users include zero-blog accounts and links open their details', async () => {
  usersService.getAll.mockResolvedValue([
    { id: 'reader', name: 'Reader', blogs: [] },
    { id: 'writer', name: 'Writer', blogs: [blog] },
  ])
  show('/users')
  await screen.findByRole('row', { name: 'Reader 0' })
  await userEvent
    .setup()
    .click(screen.getByRole('link', { name: 'Reader', exact: true }))
  await screen.findByRole('heading', { name: 'Reader' })
  expect(screen.getByText('No blogs added yet.')).toBeVisible()
})
