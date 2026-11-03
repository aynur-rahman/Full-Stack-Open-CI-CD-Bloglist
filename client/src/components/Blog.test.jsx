import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Blog from './Blog'

const blog = {
  id: 'blog-1',
  title: 'Testing React well',
  author: 'Ada Writer',
  url: 'https://example.com/react',
  likes: 7,
  user: { id: 'owner-id', username: 'owner', name: 'Blog Owner' },
}
const owner = { username: 'owner' }
const other = { username: 'other' }

describe('routed single blog view', () => {
  test('anonymous readers see all details and no action buttons', () => {
    render(<Blog blog={blog} user={null} />)
    expect(screen.getByRole('heading', { name: blog.title })).toBeVisible()
    expect(screen.getByText(blog.author)).toBeVisible()
    expect(screen.getByRole('link', { name: blog.url })).toHaveAttribute(
      'href',
      blog.url,
    )
    expect(screen.getByText('7 likes')).toBeVisible()
    expect(screen.getByText('Added by Blog Owner')).toBeVisible()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
  test('authenticated non-creators see only the like button', () => {
    render(<Blog blog={blog} user={other} />)
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(
      screen.getByRole('button', { name: 'Like', exact: true }),
    ).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Delete' }),
    ).not.toBeInTheDocument()
  })
  test('creator sees both like and delete buttons', () => {
    render(<Blog blog={blog} user={owner} />)
    expect(
      screen.getByRole('button', { name: 'Like', exact: true }),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeVisible()
  })
  test('two like clicks call the received event handler twice', async () => {
    const onLike = vi.fn().mockResolvedValue(undefined)
    render(<Blog blog={blog} user={other} onLike={onLike} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Like', exact: true }))
    await user.click(screen.getByRole('button', { name: 'Like', exact: true }))
    expect(onLike).toHaveBeenCalledTimes(2)
    expect(onLike).toHaveBeenNthCalledWith(1, blog)
  })
  test('cancelled confirmation never calls delete', async () => {
    const onDelete = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<Blog blog={blog} user={owner} onDelete={onDelete} />)
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Delete' }))
    expect(window.confirm).toHaveBeenCalledWith(
      'Remove "Testing React well" by Ada Writer?',
    )
    expect(onDelete).not.toHaveBeenCalled()
  })
  test('confirmed deletion calls its handler', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<Blog blog={blog} user={owner} onDelete={onDelete} />)
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith(blog)
  })
  test('untrusted URL schemes are rendered as text, not executable links', () => {
    render(<Blog blog={{ ...blog, url: 'javascript:alert(1)' }} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('javascript:alert(1)')).toBeVisible()
  })
})
