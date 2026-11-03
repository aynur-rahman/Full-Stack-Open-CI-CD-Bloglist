const key = 'loggedExtensionBloglistUser'
export const getUser = () => {
  try {
    const user = JSON.parse(window.localStorage.getItem(key))
    return user &&
      typeof user.token === 'string' &&
      user.token &&
      typeof user.username === 'string' &&
      user.username
      ? user
      : null
  } catch {
    return null
  }
}
export const saveUser = (user) =>
  window.localStorage.setItem(key, JSON.stringify(user))
export const removeUser = () => window.localStorage.removeItem(key)
