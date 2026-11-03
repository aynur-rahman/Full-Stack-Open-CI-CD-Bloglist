import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import usersService from '../services/users'
import { BlogList, Panel, UsersTable } from '../styles'
const Users = () => {
  const { id } = useParams()
  const [users, setUsers] = useState(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    usersService
      .getAll()
      .then((data) => {
        if (active) setUsers(data)
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => {
      active = false
    }
  }, [])
  if (error)
    return (
      <Panel role="alert">
        Could not load users. Please reload to try again.
      </Panel>
    )
  if (!users) return <p role="status">Loading users…</p>
  if (id) {
    const user = users.find((user) => user.id === id)
    if (!user)
      return (
        <Panel>
          <h1>User not found</h1>
          <Link to="/users">Back to users</Link>
        </Panel>
      )
    return (
      <Panel>
        <h1>{user.name || user.username}</h1>
        <h2>Added blogs</h2>
        {user.blogs.length ? (
          <BlogList>
            {user.blogs.map((blog) => (
              <li key={blog.id}>
                <Link to={`/blogs/${blog.id}`}>{blog.title}</Link>
              </li>
            ))}
          </BlogList>
        ) : (
          <p>No blogs added yet.</p>
        )}
        <Link to="/users">All users</Link>
      </Panel>
    )
  }
  return (
    <Panel>
      <h1>Users</h1>
      <UsersTable>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Blogs created</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <Link to={`/users/${user.id}`}>
                  {user.name || user.username}
                </Link>
              </td>
              <td>{user.blogs.length}</td>
            </tr>
          ))}
        </tbody>
      </UsersTable>
    </Panel>
  )
}
export default Users
