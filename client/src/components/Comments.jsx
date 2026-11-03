import { useState } from 'react'
import { Button, Form, CommentList } from '../styles'
const Comments = ({ comments, onComment, pending }) => {
  const [content, setContent] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    if (await onComment(content.trim())) setContent('')
  }
  return (
    <section aria-labelledby="comments-heading">
      <h2 id="comments-heading">Comments</h2>
      <Form onSubmit={submit}>
        <label>
          Comment
          <input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
            maxLength={2000}
          />
        </label>
        <div>
          <Button disabled={pending || !content.trim()}>add comment</Button>
        </div>
      </Form>
      {comments.length ? (
        <CommentList>
          {comments.map((comment, index) => (
            <li key={index}>{comment}</li>
          ))}
        </CommentList>
      ) : (
        <p className="muted">No comments yet.</p>
      )}
    </section>
  )
}
export default Comments
