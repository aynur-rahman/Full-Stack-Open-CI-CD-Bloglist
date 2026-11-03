import { test, expect } from "@playwright/test"
import { resetDatabase } from "./test_helper.js"

const BROKEN_BLOG_ID = "000000000000000000000001"

// Blog.jsx reads blog.user.name without a null check, so a blog whose
// user reference is missing crashes the render and trips the ErrorBoundary.
// Navigating to a merely nonexistent id does not: Blog.jsx guards that case
// itself and renders a NotFound component instead of throwing.
const mockBlogWithMissingUser = (page) =>
  page.route("**/api/blogs", (route) =>
    route.fulfill({
      json: [
        {
          id: BROKEN_BLOG_ID,
          title: "A blog with a missing user",
          author: "Ghost Author",
          url: "http://example.com",
          likes: 0,
          comments: [],
          user: null,
        },
      ],
    }),
  )

test.describe("Error boundary", () => {
  test.beforeEach(async ({ request, page }) => {
    await resetDatabase(request)
    await mockBlogWithMissingUser(page)
  })

  test("a rendering error is caught and a friendly message is shown instead of a blank page", async ({
    page,
  }) => {
    await page.goto(`/blogs/${BROKEN_BLOG_ID}`)

    await expect(page.getByText(/something went wrong/i)).toBeVisible()
  })

  test("the navigation bar stays outside the error boundary and remains usable", async ({
    page,
  }) => {
    await page.goto(`/blogs/${BROKEN_BLOG_ID}`)

    // ErrorBoundary (App.jsx) is not keyed to the route, so once it catches
    // an error it keeps rendering its fallback even after the URL changes.
    // The nav bar itself, rendered outside the boundary, is what stays usable.
    const blogsLink = page.getByRole("link", { name: "blogs", exact: true })
    await expect(blogsLink).toBeVisible()

    await blogsLink.click()

    await expect(page).toHaveURL("/")
  })
})
