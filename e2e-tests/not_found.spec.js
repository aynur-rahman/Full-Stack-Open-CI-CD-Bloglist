import { test, expect } from '@playwright/test'
import { resetDatabase } from './test_helper.js'

test.describe('Nonexisting routes', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request)
  })

  test('navigating to a route that does not exist shows a page not found message', async ({ page }) => {
    await page.goto('/this/route/does/not/exist')

    await expect(page.getByText(/page not found/i)).toBeVisible()
  })

  test('the navigation bar is still visible on the page not found view', async ({ page }) => {
    await page.goto('/some-nonexisting-path')

    await expect(page.getByRole('link', { name: 'blogs', exact: true })).toBeVisible()
  })

  test('the user can navigate back to the blog list from the page not found view', async ({ page }) => {
    await page.goto('/some-nonexisting-path')

    await page.getByRole('link', { name: 'blogs', exact: true }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'blogs' })).toBeVisible()
  })
})
