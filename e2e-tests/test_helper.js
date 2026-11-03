const SERVER_URL = 'http://localhost:3001'

export const resetDatabase = async request => {
  await request.post(`${SERVER_URL}/api/testing/reset`)
}

export const createUser = async (request, user) => {
  const response = await request.post(`${SERVER_URL}/api/users`, { data: user })
  return response.json()
}

export const apiLogin = async (request, credentials) => {
  const response = await request.post(`${SERVER_URL}/api/login`, { data: credentials })
  return response.json()
}

export const createBlogViaApi = async (request, token, blog) => {
  const response = await request.post(`${SERVER_URL}/api/blogs`, {
    data: blog,
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.json()
}

export const login = async (page, { username, password }) => {
  await page.getByRole('link', { name: 'login', exact: true }).click()
  const inputs = page.locator('form input')
  await inputs.nth(0).fill(username)
  await inputs.nth(1).fill(password)
  await page.getByRole('button', { name: 'login' }).click()
  await page.getByRole('button', { name: 'logout' }).waitFor()
}

export const createBlog = async (page, { title, author, url }) => {
  await page.getByRole('link', { name: 'new blog', exact: true }).click()
  const inputs = page.locator('form input')
  await inputs.nth(0).fill(title)
  await inputs.nth(1).fill(author)
  await inputs.nth(2).fill(url)
  await page.getByRole('button', { name: 'create' }).click()
}
