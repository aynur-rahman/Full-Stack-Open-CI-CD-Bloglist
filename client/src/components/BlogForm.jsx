import { useState } from 'react'
import { Button, Form, Panel } from '../styles'
const BlogForm = ({ onCreate, onCancel }) => {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [url, setUrl] = useState('')
  const [pending, setPending] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    if (pending) return
    setPending(true)
    try {
      if (
        await onCreate({
          title: title.trim(),
          author: author.trim(),
          url: url.trim(),
        })
      ) {
        setTitle('')
        setAuthor('')
        setUrl('')
      }
    } finally {
      setPending(false)
    }
  }
  return (
    <Panel>
      <h1>Create a new blog</h1>
      <p className="muted">Share an article worth reading.</p>
      <Form onSubmit={submit}>
        <label>
          Title
          <input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>
        <label>
          Author
          <input
            name="author"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
          />
        </label>
        <label>
          URL
          <input
            name="url"
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            required
          />
        </label>
        <div className="actions">
          <Button type="submit" disabled={pending}>
            {pending ? 'Creating…' : 'Create blog'}
          </Button>
          <Button
            type="button"
            $secondary
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </Button>
        </div>
      </Form>
    </Panel>
  )
}
export default BlogForm
