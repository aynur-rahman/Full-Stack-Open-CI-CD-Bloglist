import { beforeEach, expect, test, vi } from 'vitest'
import axios from 'axios'
import blogs from './blogs'
vi.mock('axios')
beforeEach(() => {
  axios.get.mockResolvedValue({ data: [] })
  axios.post.mockResolvedValue({ data: {} })
  axios.put.mockResolvedValue({ data: {} })
  axios.delete.mockResolvedValue({})
})
test('GET uses the public blog endpoint', async () => {
  await expect(blogs.getAll()).resolves.toEqual([])
  expect(axios.get).toHaveBeenCalledExactlyOnceWith('/api/blogs')
})
test('create sends values and bearer authentication', async () => {
  const values = {
    title: 'Title',
    author: 'Author',
    url: 'https://example.com',
  }
  await blogs.create(values, 'test-token')
  expect(axios.post).toHaveBeenCalledExactlyOnceWith('/api/blogs', values, {
    headers: { Authorization: 'Bearer test-token' },
  })
})
test('like sends a full blog payload and the creator id, without mutating input', async () => {
  const blog = {
    id: 'blog-id',
    title: 'Title',
    author: 'Author',
    url: 'https://example.com',
    likes: 4,
    user: { id: 'creator-id', name: 'Creator' },
  }
  await blogs.like(blog, 'test-token')
  expect(axios.put).toHaveBeenCalledExactlyOnceWith(
    '/api/blogs/blog-id',
    {
      title: 'Title',
      author: 'Author',
      url: 'https://example.com',
      likes: 5,
      user: 'creator-id',
    },
    { headers: { Authorization: 'Bearer test-token' } },
  )
  expect(blog.likes).toBe(4)
  expect(blog.user.name).toBe('Creator')
})
test('delete authenticates the request', async () => {
  await blogs.remove('blog-id', 'test-token')
  expect(axios.delete).toHaveBeenCalledExactlyOnceWith('/api/blogs/blog-id', {
    headers: { Authorization: 'Bearer test-token' },
  })
})
