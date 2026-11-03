import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BlogForm from './BlogForm'

const fill = async (user) => {
  await user.type(screen.getByLabelText('Title'), 'A useful article')
  await user.type(screen.getByLabelText('Author'), 'Grace Writer')
  await user.type(screen.getByLabelText('URL'), 'https://example.com/article')
}
test('submits the exact title, author and URL to the received handler', async () => {
  const onCreate = vi.fn().mockResolvedValue(true)
  render(<BlogForm onCreate={onCreate} />)
  const user = userEvent.setup()
  await fill(user)
  await user.click(screen.getByRole('button', { name: 'Create blog' }))
  expect(onCreate).toHaveBeenCalledExactlyOnceWith({
    title: 'A useful article',
    author: 'Grace Writer',
    url: 'https://example.com/article',
  })
  expect(screen.getByLabelText('Title')).toHaveValue('')
})
test('failed creation retains all entered values for retry', async () => {
  render(<BlogForm onCreate={vi.fn().mockResolvedValue(false)} />)
  const user = userEvent.setup()
  await fill(user)
  await user.click(screen.getByRole('button', { name: 'Create blog' }))
  expect(screen.getByLabelText('Title')).toHaveValue('A useful article')
  expect(screen.getByLabelText('Author')).toHaveValue('Grace Writer')
  expect(screen.getByLabelText('URL')).toHaveValue(
    'https://example.com/article',
  )
})
test('cancel does not submit the form', async () => {
  const onCreate = vi.fn()
  const onCancel = vi.fn()
  render(<BlogForm onCreate={onCreate} onCancel={onCancel} />)
  await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel' }))
  expect(onCancel).toHaveBeenCalledOnce()
  expect(onCreate).not.toHaveBeenCalled()
})
