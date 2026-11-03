import { useEffect } from 'react'
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom'
import Blog from './components/Blog'
import BlogForm from './components/BlogForm'
import LoginForm from './components/LoginForm'
import Notification from './components/Notification'
import ErrorBoundary from './components/ErrorBoundary'
import Users from './components/Users'
import Comments from './components/Comments'
import { useBlogStore } from './stores/blogs'
import { useUserStore } from './stores/user'
import { useNotificationStore } from './stores/notification'
import { BlogList, Button, GlobalStyle, Nav, Shell, Panel } from './styles'
const BlogRoute = ({
  blogs,
  loading,
  error,
  user,
  onLike,
  onDelete,
  onComment,
  pending,
}) => {
  const { id } = useParams()
  if (loading) return <p role="status">Loading blog…</p>
  if (error)
    return (
      <p>
        Blog details are unavailable while the reading list cannot be loaded.
      </p>
    )
  const blog = blogs.find((blog) => blog.id === id)
  if (!blog)
    return (
      <Panel>
        <h1>Blog not found</h1>
        <Link to="/">Back to blogs</Link>
      </Panel>
    )
  // A missing creator violates the API contract; the surrounding boundary provides recovery.
  if (!blog.user) throw new Error('Blog creator is missing')
  return (
    <>
      <Blog
        key={blog.id}
        blog={blog}
        user={user}
        onLike={onLike}
        onDelete={onDelete}
      />
      <Panel>
        <Comments
          comments={blog.comments || []}
          pending={pending.includes(id)}
          onComment={(content) => onComment(id, content)}
        />
      </Panel>
    </>
  )
}
const App = () => {
  const {
    blogs,
    loading,
    ready,
    error,
    pending,
    initialize,
    create,
    like,
    remove,
    comment,
  } = useBlogStore()
  const { user, login, logout } = useUserStore()
  const { notification, notify } = useNotificationStore()
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    initialize()
  }, [initialize])
  const signOut = () => {
    logout()
    navigate('/')
  }
  const failed = (error, fallback) => {
    if (error.response?.status === 401) {
      signOut()
      notify('Your session has expired. Please log in again.', 'error')
    } else notify(error.response?.data?.error || fallback, 'error')
  }
  const signIn = async (credentials) => {
    try {
      await login(credentials)
      navigate('/')
      notify('You are logged in.')
    } catch (error) {
      notify(
        error.response?.status === 401
          ? 'Incorrect username or password.'
          : 'Login failed. Please try again.',
        'error',
      )
    }
  }
  const createBlog = async (values) => {
    try {
      const result = await create(values)
      if (!result) return false
      navigate('/')
      notify(`Added "${result.title}".`)
      return true
    } catch (error) {
      failed(error, 'Could not create the blog. Please try again.')
      return false
    }
  }
  const likeBlog = async (blog) => {
    try {
      await like(blog.id)
    } catch (error) {
      failed(error, 'Could not save your like.')
    }
  }
  const deleteBlog = async (blog) => {
    try {
      if (await remove(blog.id)) {
        navigate('/')
        notify(`Deleted "${blog.title}".`)
      }
    } catch (error) {
      failed(error, 'Could not delete the blog.')
    }
  }
  const addComment = async (id, content) => {
    try {
      return await comment(id, content)
    } catch (error) {
      notify(
        error.response?.data?.error || 'Could not add your comment.',
        'error',
      )
      return false
    }
  }
  return (
    <>
      <GlobalStyle />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Nav aria-label="Main navigation">
        <div>
          <Link className="brand" to="/">
            Blog list
          </Link>
          <NavLink to="/" end>
            blogs
          </NavLink>
          <NavLink to="/users">users</NavLink>
          {user ? (
            <>
              <NavLink to="/blogs/new">new blog</NavLink>
              <span className="identity">
                {user.name || user.username} logged in
              </span>
              <Button onClick={signOut}>logout</Button>
            </>
          ) : (
            <NavLink to="/login">login</NavLink>
          )}
        </div>
      </Nav>
      <Shell id="main" tabIndex={-1}>
        <ErrorBoundary key={location.pathname}>
          <Notification notification={notification} />
          {error && (
            <div role="alert">
              <p>{error}</p>
              <Button onClick={initialize}>Retry</Button>
            </div>
          )}
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <h1>Blogs worth your time.</h1>
                  <p className="muted">
                    A shared reading list, most liked first.
                  </p>
                  {loading || !ready ? (
                    <p role="status">Loading blogs…</p>
                  ) : (
                    !error &&
                    (blogs.length ? (
                      <BlogList>
                        {blogs
                          .toSorted((a, b) => b.likes - a.likes)
                          .map((blog) => (
                            <li key={blog.id}>
                              <Link to={`/blogs/${blog.id}`}>{blog.title}</Link>
                              <p className="muted">
                                {blog.author || 'Unknown author'}
                              </p>
                            </li>
                          ))}
                      </BlogList>
                    ) : (
                      <p>No blogs yet.</p>
                    ))
                  )}
                </>
              }
            />
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/" replace />
                ) : (
                  <LoginForm onLogin={signIn} />
                )
              }
            />
            <Route
              path="/blogs/new"
              element={
                !user ? (
                  <Navigate to="/login" replace />
                ) : loading || !ready ? (
                  <p role="status">Loading blogs…</p>
                ) : error ? (
                  <p>Load the reading list before adding a blog.</p>
                ) : (
                  <BlogForm
                    onCreate={createBlog}
                    onCancel={() => navigate('/')}
                  />
                )
              }
            />
            <Route
              path="/blogs/:id"
              element={
                <BlogRoute
                  blogs={blogs}
                  loading={loading || !ready}
                  error={error}
                  user={user}
                  onLike={likeBlog}
                  onDelete={deleteBlog}
                  onComment={addComment}
                  pending={pending}
                />
              }
            />
            <Route path="/users" element={<Users />} />
            <Route path="/users/:id" element={<Users />} />
            <Route
              path="*"
              element={
                <Panel>
                  <h1>Page not found</h1>
                  <Link to="/">Back to blogs</Link>
                </Panel>
              }
            />
          </Routes>
        </ErrorBoundary>
      </Shell>
    </>
  )
}
export default App
