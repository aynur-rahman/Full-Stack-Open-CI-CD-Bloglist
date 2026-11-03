import { useState } from 'react'
import { BlogPanel, Button, DeleteButton } from '../styles'
const Blog = ({ blog, user, onLike, onDelete }) => {
  const [pending, setPending] = useState(false)
  const run = async (action) => {
    if (pending) return
    setPending(true)
    try {
      await action(blog)
    } finally {
      setPending(false)
    }
  }
  const remove = () => {
    if (
      window.confirm(
        `Remove "${blog.title}" by ${blog.author || 'Unknown author'}?`,
      )
    )
      run(onDelete)
  }
  const safeUrl = /^https?:\/\//i.test(blog.url)
  const isCreator = user && blog.user?.username === user.username
  return (
    <BlogPanel aria-label="Blog details">
      <p className="eyebrow">From the reading list</p>
      <h1>{blog.title}</h1>
      <p className="author">{blog.author || 'Unknown author'}</p>
      {safeUrl ? (
        <a
          className="source"
          href={blog.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {blog.url}
        </a>
      ) : (
        <p>{blog.url}</p>
      )}
      <div className="blog-meta">
        <p>
          Added by {blog.user?.name || blog.user?.username || 'Unknown user'}
        </p>
        <p data-testid="like-count">
          {blog.likes} {blog.likes === 1 ? 'like' : 'likes'}
        </p>
        {user && (
          <div className="actions">
            <Button onClick={() => run(onLike)} disabled={pending}>
              Like
            </Button>
            {isCreator && (
              <DeleteButton onClick={remove} disabled={pending}>
                Delete
              </DeleteButton>
            )}
          </div>
        )}
      </div>
    </BlogPanel>
  )
}
export default Blog
