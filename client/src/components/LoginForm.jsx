import { useState } from 'react'
import { Button, Form, Panel } from '../styles'
const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    if (pending) return
    setPending(true)
    try {
      await onLogin({ username, password })
    } finally {
      setPending(false)
    }
  }
  return (
    <Panel>
      <h1>Log in</h1>
      <p className="muted">
        Log in to share a blog or like something you enjoyed.
      </p>
      <Form onSubmit={submit}>
        <label>
          Username
          <input
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <div>
          <Button disabled={pending} type="submit">
            {pending ? 'Logging in…' : 'login'}
          </Button>
        </div>
      </Form>
    </Panel>
  )
}
export default LoginForm
