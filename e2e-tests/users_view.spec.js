import { test, expect } from '@playwright/test'
import { resetDatabase, createUser, apiLogin, createBlogViaApi, login } from './test_helper.js'

test.describe('Users view', () => {
  test.beforeEach(async ({ request, page }) => {
    await resetDatabase(request)

    await createUser(request, {
      username: 'blogger',
      name: 'Blogging Betty',
      password: 'salainen',
    })
    await createUser(request, {
      username: 'lurker',
      name: 'Lurking Larry',
      password: 'salainen',
    })

    const { token } = await apiLogin(request, { username: 'blogger', password: 'salainen' })

    await createBlogViaApi(request, token, {
      title: 'First blog by Betty',
      author: 'Blogging Betty',
      url: 'https://example.com/first',
    })
    await createBlogViaApi(request, token, {
      title: 'Second blog by Betty',
      author: 'Blogging Betty',
      url: 'https://example.com/second',
    })

    await page.goto('/')
    await login(page, { username: 'blogger', password: 'salainen' })
  })

  test('lists every user together with the number of blogs they have added', async ({ page }) => {
    await page.getByRole('link', { name: 'users', exact: true }).click()

    const bettyRow = page.getByRole('row', { name: /blogging betty/i })
    await expect(bettyRow).toContainText('2')

    const larryRow = page.getByRole('row', { name: /lurking larry/i })
    await expect(larryRow).toContainText('0')
  })

  test('clicking a user name opens that user\'s own page listing their blogs', async ({ page }) => {
    await page.getByRole('link', { name: 'users', exact: true }).click()

    await page.getByRole('link', { name: 'Blogging Betty', exact: true }).click()

    await expect(page.getByRole('heading', { name: 'Blogging Betty' })).toBeVisible()
    await expect(page.getByText('First blog by Betty')).toBeVisible()
    await expect(page.getByText('Second blog by Betty')).toBeVisible()
  })

  test('a user with no blogs has an empty own page', async ({ page }) => {
    await page.getByRole('link', { name: 'users', exact: true }).click()

    await page.getByRole('link', { name: 'Lurking Larry', exact: true }).click()

    await expect(page.getByRole('heading', { name: 'Lurking Larry' })).toBeVisible()
    await expect(page.getByText('First blog by Betty')).toHaveCount(0)
  })
})
