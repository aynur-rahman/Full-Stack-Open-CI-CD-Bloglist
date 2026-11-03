import { test, expect } from '@playwright/test'
import { resetDatabase, createUser, apiLogin, createBlogViaApi, login } from './test_helper.js'

test.describe('Comments', () => {
  let blog

  test.beforeEach(async ({ request, page }) => {
    await resetDatabase(request)

    await createUser(request, {
      username: 'commenter',
      name: 'Casey Commenter',
      password: 'salainen',
    })
    const { token } = await apiLogin(request, { username: 'commenter', password: 'salainen' })

    blog = await createBlogViaApi(request, token, {
      title: 'A blog worth commenting on',
      author: 'Casey Commenter',
      url: 'https://example.com/comment-me',
    })

    await page.goto('/')
    await login(page, { username: 'commenter', password: 'salainen' })
    await page.getByRole('link', { name: blog.title }).click()
  })

  test('a comment can be added to a blog and is shown immediately', async ({ page }) => {
    const comment = `a thoughtful comment ${Date.now()}`

    await page.getByRole('textbox', { name: /comment/i }).fill(comment)
    await page.getByRole('button', { name: /add comment/i }).click()

    await expect(page.getByText(comment)).toBeVisible()
  })

  test('added comments are persisted on the server and survive a reload', async ({ page }) => {
    const comment = `a persistent comment ${Date.now()}`

    await page.getByRole('textbox', { name: /comment/i }).fill(comment)
    await page.getByRole('button', { name: /add comment/i }).click()
    await expect(page.getByText(comment)).toBeVisible()

    await page.reload()

    await expect(page.getByText(comment)).toBeVisible()
  })

  test('multiple comments can be added and all of them are shown', async ({ page }) => {
    const firstComment = `first comment ${Date.now()}`
    const secondComment = `second comment ${Date.now()}`

    await page.getByRole('textbox', { name: /comment/i }).fill(firstComment)
    await page.getByRole('button', { name: /add comment/i }).click()
    await expect(page.getByText(firstComment)).toBeVisible()

    await page.getByRole('textbox', { name: /comment/i }).fill(secondComment)
    await page.getByRole('button', { name: /add comment/i }).click()

    await expect(page.getByText(firstComment)).toBeVisible()
    await expect(page.getByText(secondComment)).toBeVisible()
  })
})
